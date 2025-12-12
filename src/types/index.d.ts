export type Project = {
  id: string;
  title: string;
  description: string;
  detail: string;
  tags: string[];
  category: 'Лендинг' | 'Анимация' | 'Эксперимент' | 'Продукт' | 'Концепт';
  link?: string;
  year?: string;
  color?: string;
};

export type Experiment = {
  id: string;
  title: string;
  description: string;
  label: string;
  intensity?: 'calm' | 'bold';
};
