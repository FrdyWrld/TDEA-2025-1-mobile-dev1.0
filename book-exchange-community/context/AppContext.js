import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [userDetails, setUserDetails] = useState({
    name: '',
    phone: '',
    address: '',
    photoUrl: '',
  });

  const [theme, setTheme] = useState('light');

  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) setTheme(savedTheme);
    })();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        setIsAuthenticated,
        userDetails,
        setUserDetails,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
