/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import UserCard from './pages/UserCard';
import GuardScanner from './pages/GuardScanner';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/user/:id" element={<UserCard />} />
        <Route path="/guard" element={<GuardScanner />} />
      </Routes>
    </BrowserRouter>
  );
}
