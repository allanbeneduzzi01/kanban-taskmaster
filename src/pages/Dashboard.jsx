import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle, Clock, Calendar, Plus, X, ArrowRight, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, completed: 0, completedLast7Days: 0, upcomingTasks: [] });
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', start_time: '', duration_minutes: 60, priority: 'medium', category: 'trabalho', tags: [] });
  const userId = 1;

  const fetchDashboardData = async () => {
    try {
      const [dashRes, userRes] = await Promise.all([
        axios.get(`/api/dashboard/${userId}`),
        axios.get(`/api/users/${userId}`)
      ]);
      setStats(dashRes.data);
      setUser(userRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
    
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await axios.post('/api/tasks', { ...newTask, user_id: userId });
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', start_time: '', duration_minutes: 60, priority: 'medium', category: 'trabalho', tags: [] });
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-400">Carregando painel...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative h-full pb-20">
      
      {/* Header & Saudação */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{user.name.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-slate-400 text-lg">Aqui está o resumo das suas atividades.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
          <p className="text-sm font-medium text-slate-300">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Glassmorphism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-500/20 p-3 rounded-2xl">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">Total de Tarefas</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{stats.total}</span>
            <span className="text-sm text-slate-400">registradas</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-500/20 p-3 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">Concluídas (7 dias)</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{stats.completedLast7Days}</span>
            <span className="text-sm flex items-center text-emerald-400 font-medium ml-2">
              <TrendingUp className="w-4 h-4 mr-1" /> Ótimo ritmo
            </span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-500/20 p-3 rounded-2xl">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">Total Concluído</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{stats.completed}</span>
            <span className="text-sm text-slate-400">historicamente</span>
          </div>
        </div>
      </div>

      {/* Lista de Próximas Tarefas */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Próximas a vencer
          </h3>
          <Link to="/tasks" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="glass-panel rounded-3xl overflow-hidden">
          {stats.upcomingTasks && stats.upcomingTasks.length > 0 ? (
            <ul className="divide-y divide-white/5">
              {stats.upcomingTasks.map(task => (
                <li key={task.id} className="p-5 hover:bg-white/5 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                    <div>
                      <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors">{task.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">
                        {format(new Date(task.start_time), "dd/MM/yyyy 'às' HH:mm")} • Duração: {task.duration_minutes}m
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium text-slate-300 border border-white/5 uppercase tracking-wider">
                    {task.category}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400/50" />
              </div>
              <h4 className="text-slate-300 font-medium mb-1">Tudo limpo por aqui!</h4>
              <p className="text-slate-500 text-sm">Você não tem tarefas futuras próximas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_40px_rgba(37,99,235,0.6)] hover:scale-105 transition-all z-40 border border-white/20 text-white"
        title="Nova Tarefa"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Modal de Criação Simples */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="glass-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden slide-in-from-bottom-8 flex flex-col border border-white/10">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Criar Nova Tarefa</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Título *</label>
                <input 
                  required
                  type="text" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="O que precisa ser feito?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Horário de Início</label>
                  <input 
                    required
                    type="datetime-local" 
                    value={newTask.start_time}
                    onChange={e => setNewTask({...newTask, start_time: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duração (minutos)</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={newTask.duration_minutes}
                    onChange={e => setNewTask({...newTask, duration_minutes: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                <select 
                  value={newTask.category}
                  onChange={e => setNewTask({...newTask, category: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white [&>option]:bg-slate-800"
                >
                  <option value="trabalho">Trabalho</option>
                  <option value="casa">Casa</option>
                  <option value="estudos">Estudos</option>
                  <option value="pessoal">Pessoal</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-300 font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
