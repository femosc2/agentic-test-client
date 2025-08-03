import React, { useState } from 'react';
import styles from './styles.module.scss';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'My App' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1>{title}</h1>
        </div>
        
        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          <ul className={styles.navList}>
            <li><a href="/" className={styles.navLink}>Home</a></li>
            <li><a href="/about" className={styles.navLink}>About</a></li>
            <li><a href="/services" className={styles.navLink}>Services</a></li>
            <li><a href="/contact" className={styles.navLink}>Contact</a></li>
          </ul>
        </nav>

        <button 
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
