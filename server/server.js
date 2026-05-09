import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota: Perfil do Usuário
app.get('/api/users/:id', (req, res) => {
  db.get('SELECT id, name, email, avatar FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

// Rota: Atualizar Usuário
app.put('/api/users/:id', (req, res) => {
  const { avatar } = req.body;
  const query = 'UPDATE users SET avatar = COALESCE(?, avatar) WHERE id = ?';
  db.run(query, [avatar, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Usuário atualizado com sucesso!' });
  });
});

// Rota: Dashboard Estatísticas e Recentes
app.get('/api/dashboard/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT * FROM tasks WHERE user_id = ?';

  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    let total = rows.length;
    let completed = 0;
    let completedLast7Days = 0;
    
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Variáveis para upcoming tasks
    const upcomingTasks = [];

    rows.forEach(task => {
      if (task.status === 'completed') {
        completed++;
        if (task.start_time) {
           const startTimeDate = new Date(task.start_time);
           if (startTimeDate >= sevenDaysAgo && startTimeDate <= now) {
              completedLast7Days++;
           }
        } else {
           completedLast7Days++; 
        }
      } else {
        if (task.start_time) {
          const startTime = new Date(task.start_time);
          if (startTime > now) {
            upcomingTasks.push(task);
          }
        }
      }
    });

    upcomingTasks.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
    res.json({ 
      total, 
      completed, 
      completedLast7Days,
      upcomingTasks: upcomingTasks.slice(0, 5)
    });
  });
});

// Rota: Listar Tarefas com Filtros e Tags
app.get('/api/tasks/:userId', (req, res) => {
  const userId = req.params.userId;
  const { category, status } = req.query;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY start_time ASC';

  db.all(query, params, (err, tasks) => {
    if (err) return res.status(500).json({ error: err.message });
    if (tasks.length === 0) return res.json([]);

    const taskIds = tasks.map(t => t.id).join(',');
    const tagsQuery = `
      SELECT tt.task_id, t.id, t.name 
      FROM task_tags tt
      JOIN tags t ON tt.tag_id = t.id
      WHERE tt.task_id IN (${taskIds})
    `;
    
    db.all(tagsQuery, [], (err, tags) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const tasksWithTags = tasks.map(task => {
        return {
          ...task,
          tags: tags.filter(tag => tag.task_id === task.id).map(t => ({ id: t.id, name: t.name }))
        };
      });
      res.json(tasksWithTags);
    });
  });
});

// Rota: Criar Tarefa com Tags
app.post('/api/tasks', (req, res) => {
  const { user_id, title, description, start_time, duration_minutes, priority, category, tags } = req.body;
  
  db.run('BEGIN TRANSACTION');

  const query = `
    INSERT INTO tasks (user_id, title, description, start_time, duration_minutes, priority, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [user_id, title, description, start_time, duration_minutes, priority, category], function(err) {
    if (err) {
      db.run('ROLLBACK');
      return res.status(500).json({ error: err.message });
    }
    
    const taskId = this.lastID;
    
    if (tags && tags.length > 0) {
      let tagsProcessed = 0;
      
      tags.forEach(tagName => {
        db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err, row) => {
          if (row) {
            db.run('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)', [taskId, row.id]);
            checkDone();
          } else {
            db.run('INSERT INTO tags (name) VALUES (?)', [tagName], function(err) {
              if (!err) {
                db.run('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)', [taskId, this.lastID]);
              }
              checkDone();
            });
          }
        });
      });

      function checkDone() {
        tagsProcessed++;
        if (tagsProcessed === tags.length) {
          db.run('COMMIT');
          res.json({ id: taskId, message: 'Tarefa criada com sucesso!' });
        }
      }
    } else {
      db.run('COMMIT');
      res.json({ id: taskId, message: 'Tarefa criada com sucesso!' });
    }
  });
});

// Rota: Atualizar Tarefa
app.put('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { title, description, start_time, duration_minutes, priority, category, status } = req.body;

  const query = `
    UPDATE tasks 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        start_time = COALESCE(?, start_time),
        duration_minutes = COALESCE(?, duration_minutes),
        priority = COALESCE(?, priority),
        category = COALESCE(?, category),
        status = COALESCE(?, status)
    WHERE id = ?
  `;

  db.run(query, [title, description, start_time, duration_minutes, priority, category, status, taskId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tarefa atualizada com sucesso!' });
  });
});

// Rota: Excluir Tarefa
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tarefa excluída com sucesso!' });
  });
});

// Export for Vercel
export default app;

// Start locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log("Servidor rodando na porta " + port);
  });
}

