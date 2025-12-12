import type { Experiment } from '../types';

export const experiments: Experiment[] = [
  {
    id: 'portal',
    title: 'Неоновый портал',
    description:
      'Трёхмерная сцена, которая «склеивается» между окнами. Открой пару окон и разложи их рядом — получится цельный портал.',
    label: 'webgl / multi-window',
    intensity: 'bold',
  },
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
