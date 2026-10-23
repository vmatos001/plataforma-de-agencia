import React from 'react';
import SeoLaunchQaModule from './SeoLaunchQaModule';

export default function MotorSeoQaModule({ selectedCountry = 'SV' }) {
  return (
    <div className="space-y-4">
      <SeoLaunchQaModule selectedCountry={selectedCountry} />
    </div>
  );
}
