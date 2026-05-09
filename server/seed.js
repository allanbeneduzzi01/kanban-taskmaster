const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const titles = [
  'Reunião de Alinhamento',
  'Estudar React Node',
  'Comprar Mantimentos',
  'Limpar a Garagem',
  'Exercício Físico',
  'Ler um Capítulo de Livro',
  'Ligar para a Família',
  'Planejar a Semana',
  'Ajustar Código do Kanban',
  'Passear com o Cachorro',
  'Fazer Compras do Mês',
  'Terminar Relatório Mensal'
];

const categories = ['trabalho', 'estudos', 'casa', 'pessoal'];
const priorities = ['low', 'medium', 'high'];
const statuses = ['pending', 'completed', 'pending']; // More chances of pending

const tasksToInsert = [];

for (let i = 0; i < 10; i++) {
  const title = titles[Math.floor(Math.random() * titles.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const duration_minutes = [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)];
  
  // Random time between -3 days and +3 days
  const now = new Date();
  const randomOffsetMs = (Math.random() * 6 - 3) * 24 * 60 * 60 * 1000; 
  const randomDate = new Date(now.getTime() + randomOffsetMs);
  
  // Format for local datetime-local without changing timezone explicitly
  const start_time = new Date(randomDate.getTime() - (randomDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

  tasksToInsert.push({
    user_id: 1,
    title,
    description: "Descrição gerada automaticamente para: " + title,
    start_time,
    duration_minutes,
    priority,
    category,
    status
  });
}

db.serialize(() => {
  db.run('BEGIN TRANSACTION');
  const stmt = db.prepare(`
    INSERT INTO tasks (user_id, title, description, start_time, duration_minutes, priority, category, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  tasksToInsert.forEach(task => {
    stmt.run(
      task.user_id,
      task.title,
      task.description,
      task.start_time,
      task.duration_minutes,
      task.priority,
      task.category,
      task.status
    );
  });

  stmt.finalize();
  db.run('COMMIT', (err) => {
    if (err) console.error('Erro ao salvar tarefas:', err);
    else console.log('10 tarefas aleatórias adicionadas com sucesso!');
    db.close();
  });
});
