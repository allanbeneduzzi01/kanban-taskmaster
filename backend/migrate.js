const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Tentar adicionar a coluna
  db.run("ALTER TABLE tasks ADD COLUMN created_at TEXT", (err) => {
    if (err) {
      console.log('Coluna created_at já existe ou erro:', err.message);
    } else {
      console.log('Coluna created_at adicionada com sucesso.');
    }

    // 2. Preencher datas de cadastro antigas para as tarefas existentes
    db.all("SELECT id FROM tasks", (err, rows) => {
      if (err) return console.error(err);
      
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare("UPDATE tasks SET created_at = ? WHERE id = ?");
      
      rows.forEach(row => {
        // Data aleatoria entre hoje e 8 dias atras
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 8); // 0 a 7
        const randomDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        const isoString = randomDate.toISOString();
        
        stmt.run(isoString, row.id);
      });
      
      stmt.finalize();
      db.run('COMMIT', () => {
        console.log('Datas de cadastro atualizadas com datas aleatórias!');
        db.close();
      });
    });
  });
});
