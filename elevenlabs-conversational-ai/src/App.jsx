import ConversationInterface from './components/ConversationInterface.jsx';
import './App.css';

function App() {
  // Agent ID yang diberikan oleh user
  const agentId = 'agent_01k0rh29kxebks7s0stwrszcfe';

  return (
    <div className="App">
      <ConversationInterface agentId={agentId} />
    </div>
  );
}

export default App;

