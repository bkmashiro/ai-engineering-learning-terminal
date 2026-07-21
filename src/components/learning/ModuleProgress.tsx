import { useEffect, useState } from 'preact/hooks';
import {
  loadLearningProgress,
  setModuleStatus,
  type ModuleStatus,
} from '../../lib/progress';
import './ModuleProgress.css';

interface ModuleProgressProps {
  moduleId: string;
}

export function ModuleProgress({ moduleId }: ModuleProgressProps) {
  const [status, setStatus] = useState<ModuleStatus>('not-started');
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    try {
      const saved = loadLearningProgress(window.localStorage);
      setStatus(saved.modules[moduleId]?.status ?? 'not-started');
    } catch {
      setAvailable(false);
    }
  }, [moduleId]);

  const toggle = () => {
    if (!available) return;
    const nextStatus: ModuleStatus = status === 'completed' ? 'in-progress' : 'completed';
    try {
      setModuleStatus(window.localStorage, moduleId, nextStatus);
      setStatus(nextStatus);
    } catch {
      setAvailable(false);
    }
  };

  const completed = status === 'completed';

  return (
    <aside class={completed ? 'module-progress is-complete' : 'module-progress'} aria-label="本课学习进度">
      <div class="module-progress__mark" aria-hidden="true">
        <svg viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" class="module-progress__track" />
          <circle cx="22" cy="22" r="18" class="module-progress__value" />
          <path d="M14.5 22.5 L19.5 27.5 L30 16.5" />
        </svg>
      </div>
      <div class="module-progress__copy">
        <span>LOCAL PROGRESS</span>
        <strong role="status">{available ? (completed ? '本课已完成' : '本课尚未完成') : '浏览器存储不可用'}</strong>
        <small>只保存在这个浏览器，不含账号和遥测。</small>
      </div>
      <button type="button" onClick={toggle} disabled={!available}>
        {completed ? '撤销完成标记' : '标记本课完成'}
      </button>
    </aside>
  );
}
