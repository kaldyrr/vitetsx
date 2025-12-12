import type { Experiment } from '../types';

export const experiments: Experiment[] = [
  {
    id: 'nodes',
    title: 'Созвездия',
    description: 'Интерактивная сеть узлов, реагирующая на курсор и образующая созвездия.',
    label: 'canvas / интерактив',
    intensity: 'calm',
  },
  {
    id: 'particles',
    title: 'Орбитальные частицы',
    description: 'Неоновые частицы, мягко вращающиеся вокруг центра, создают эффект галактики.',
    label: 'canvas / атмосферно',
    intensity: 'bold',
  },
  {
    id: 'glow-grid',
    title: 'Светящаяся сетка',
    description: 'Мерцающая сетка с шумом и плавными переливами градиентов.',
    label: 'css / генеративное',
    intensity: 'calm',
  },
];
