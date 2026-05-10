import { neon } from '@neondatabase/serverless';
import { Project } from '../../domain/entities/Project';
import { DatabasePort } from '../../domain/ports/outbound/DatabasePort';

export class NeonDatabaseAdapter implements DatabasePort {
  private async getSql() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Please add it to your environment variables to connect to Neon Postgres.');
    }
    const sql = neon(process.env.DATABASE_URL);
    
    // Auto-migrate our single projects table
    // Using JSONB as our Project is a rich document (aggregate root)
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    return sql;
  }

  async save(project: Project): Promise<void> {
    // If we're bootstrapping on build and no env var, we politely skip persisting
    if (!process.env.DATABASE_URL) {
      console.warn('[NeonDatabaseAdapter] No DATABASE_URL set. Cannot persist to database.');
      return;
    }

    const sql = await this.getSql();
    
    const projectData = {
      id: project.id,
      state: project.state,
      score: project.score,
      gaps: project.gaps,
      contradictions: project.contradictions,
      chapters: project.chapters,
      lastAnalyzedHash: project.lastAnalyzedHash,
      chatHistory: project.chatHistory,
    };

    await sql`
      INSERT INTO projects (id, data, updated_at)
      VALUES (${project.id}, ${projectData as any}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE 
      SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
    `;
  }

  async findById(id: string): Promise<Project | null> {
    if (!process.env.DATABASE_URL) return null;

    const sql = await this.getSql();
    const result = await sql`SELECT data FROM projects WHERE id = ${id}`;
    
    if (result.length === 0) return null;
    
    const row = result[0].data as any;
    
    return Project.restore(
      row.id,
      row.state,
      row.gaps || [],
      row.contradictions || [],
      row.score || 50,
      row.chapters || [],
      row.lastAnalyzedHash ?? null,
      row.chatHistory ?? []
    );
  }
}
