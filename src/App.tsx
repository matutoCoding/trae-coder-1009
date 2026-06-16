import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import AppRouter from './router';
import { useAppStore } from './store';

function App() {
  const init = useAppStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App;
