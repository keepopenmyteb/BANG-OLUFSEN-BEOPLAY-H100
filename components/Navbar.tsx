"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            BEOPLAY-H100
          </Link>
        </div>
        
        <div className={styles.center}>
          <Link href="#overview" className={styles.link}>Overview</Link>
          <Link href="#technology" className={styles.link}>Technology</Link>
          <Link href="#noise-cancelling" className={styles.link}>Noise Cancelling</Link>
          <Link href="#specs" className={styles.link}>Specs</Link>
          <Link href="#buy" className={styles.link}>Buy</Link>
        </div>

        <div className={styles.right}>
          <a href="#buy" className={`${styles.cta} btn-primary`}>
            Experience
          </a>
        </div>
      </div>
    </nav>
  );
}
