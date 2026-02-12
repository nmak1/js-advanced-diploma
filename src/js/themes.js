const themes = {
  prairie: 'prairie',
  desert: 'desert',
  arctic: 'arctic',
  mountain: 'mountain',
};

// Массив тем для циклического перебора
export const themeList = ['prairie', 'desert', 'arctic', 'mountain'];

// Функция для получения темы по уровню (бесконечный цикл)
export const getThemeByLevel = (level) => {
  const index = (level - 1) % themeList.length;
  return themeList[index];
};

export default themes;
