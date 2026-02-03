/**
 * LocalStorage wrapper with error handling
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  USER: "user",
  CART: "cart",
};

/**
 * Get item from localStorage
 * @param {string} key
 * @returns {any}
 */
export const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Set item in localStorage
 * @param {string} key
 * @param {any} value
 */
export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
};

/**
 * Remove item from localStorage
 * @param {string} key
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
  }
};

/**
 * Clear all items from localStorage
 */
export const clearAll = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

/**
 * Token management
 */
export const getAccessToken = () => getItem(STORAGE_KEYS.ACCESS_TOKEN);
export const setAccessToken = (token) =>
  setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
export const removeAccessToken = () => removeItem(STORAGE_KEYS.ACCESS_TOKEN);

/**
 * User management
 */
export const getUser = () => getItem(STORAGE_KEYS.USER);
export const setUser = (user) => setItem(STORAGE_KEYS.USER, user);
export const removeUser = () => removeItem(STORAGE_KEYS.USER);

/**
 * Cart management (backup)
 */
export const getCart = () => getItem(STORAGE_KEYS.CART);
export const setCart = (cart) => setItem(STORAGE_KEYS.CART, cart);
export const removeCart = () => removeItem(STORAGE_KEYS.CART);

export default {
  getItem,
  setItem,
  removeItem,
  clearAll,
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getUser,
  setUser,
  removeUser,
  getCart,
  setCart,
  removeCart,
};
