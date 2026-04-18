import { Link, useLocation, Outlet } from 'react-router-dom';
import { Home, CheckSquare, Settings, FolderOpen, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const userId = 1;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      }
    };
    fetchUser();
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/tasks', icon: CheckSquare, label: 'Minhas Tarefas' },
    { path: '#', icon: FolderOpen, label: 'Categorias' },
    { path: '#', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen flex text-slate-200 selection:bg-blue-500/30">
      {/* Sidebar - Glassmorphism */}
      <aside className="w-72 flex flex-col justify-between p-6 m-4 rounded-3xl glass-card">
        <div>
          <div className="flex items-center gap-3 mb-10 pl-2">
            <div className="bg-blue-600/20 p-2.5 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <CheckSquare className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">TaskMaster</h1>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium border border-transparent ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        {user && (
          <Link to="/profile" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer mt-8">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-white/10 group-hover:border-blue-400/50 transition-colors">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <UserIcon className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{user.name}</h3>
              <p className="text-sm text-slate-400 truncate">Ver perfil</p>
            </div>
          </Link>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
