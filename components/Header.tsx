/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { ShirtIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="w-full py-5 px-4 md:px-8 bg-white sticky top-0 z-40 border-b border-gray-100">
      <div className="flex items-center gap-3">
          <ShirtIcon className="w-6 h-6 text-gray-900" />
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.2em] uppercase text-gray-900">
            Gregorious Creative Studios
          </h1>
      </div>
    </header>
  );
};

export default Header;