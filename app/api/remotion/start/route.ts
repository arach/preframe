import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST() {
  try {
    const child = spawn('bun', ['run', 'studio'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
      shell: false,
      env: {
        ...process.env,
        BROWSER: 'none',
        PATH: `${process.env.PATH}:/Users/art/.bun/bin:/usr/local/bin`,
      },
    });
    child.on('error', () => { /* detached — ignore */ });
    child.unref();
    return NextResponse.json({ started: true });
  } catch (err) {
    return NextResponse.json({ started: false, error: String(err) }, { status: 500 });
  }
}
