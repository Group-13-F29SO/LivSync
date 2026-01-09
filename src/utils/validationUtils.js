export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const validateUsername = (username) => {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
};

export const validateName = (name) => {
  return name.trim().length > 0;
};

export const validateAge = (age) => {
  const ageNum = parseInt(age);
  return ageNum >= 13 && ageNum <= 120;
};

export const validateHeight = (height) => {
  const h = parseFloat(height);
  return h > 50 && h < 300;
};

export const validateWeight = (weight) => {
  const w = parseFloat(weight);
  return w > 20 && w < 500;
};
