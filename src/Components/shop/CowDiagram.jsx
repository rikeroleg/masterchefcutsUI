
import React from "react";

export default function CowDiagram({ onCutClick, cuts }) {
  const getCutInfo = (cutId) => {
    return cuts.find(c => c.cut_id === cutId);
  };

  const handleCutClick = (cutId) => {
    const cut = getCutInfo(cutId);
    if (cut && cut.availability) {
      onCutClick(cutId);
    }
  };

  const CutCircle = ({ name, cutId, onClick }) => (
    <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => onClick(cutId)}>
      <div className="w-16 h-16 border-2 border-red-400 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200">
        <div className="w-10 h-6 bg-gradient-to-r from-red-400 to-red-600 rounded-lg shadow-sm"></div>
      </div>
      <div className="text-xs font-bold text-gray-800 mt-1 text-center leading-tight max-w-16">
        {name}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-gray-200 to-gray-300 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Black banner */}
            <div className="bg-gray-900 text-white px-16 py-6 relative" style={{
              clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 50%, calc(100% - 30px) 100%, 0 100%, 30px 50%)'
            }}>
              <div className="flex items-center justify-center space-x-8">
                <div className="text-4xl font-bold tracking-wider">BEEF</div>
                <div className="w-20 h-20 bg-red-700 rounded-lg flex items-center justify-center border-4 border-white shadow-lg relative">
                  <div className="text-white">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
                      <path d="M8 8 Q12 4 20 6 Q28 4 32 8 Q36 12 34 20 Q36 28 32 32 Q28 36 20 34 Q12 36 8 32 Q4 28 6 20 Q4 12 8 8 Z"/>
                      <path d="M10 15 Q15 12 20 15 Q25 12 30 15 Q28 20 25 22 Q20 25 15 22 Q12 20 10 15 Z" fill="white" opacity="0.3"/>
                    </svg>
                  </div>
                  {/* Steam lines */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-0.5 h-4 bg-red-300 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="text-4xl font-bold tracking-wider">CUTS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Side - CHUCK */}
          <div className="col-span-2 flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">CHUCK</h3>
            <div className="grid grid-cols-2 gap-4">
              <CutCircle name="BLADE ROAST" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="7-BONE POT ROAST" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="BONELESS POT ROAST" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="CHUCK ROAST" cutId="chuck" onClick={handleCutClick} />
            </div>
            
            {/* Additional Chuck cuts */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <CutCircle name="SHORT RIBS" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="FLANKEN-STYLE RIBS" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="MOCK TENDER ROAST" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="CHUCK TOP BLADE STEAK" cutId="chuck" onClick={handleCutClick} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <CutCircle name="ARM POT ROAST" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="SHOULDER TOP BLADE STEAK" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="SHOULDER PETITE TENDER" cutId="chuck" onClick={handleCutClick} />
              <CutCircle name="SHOULDER PETITE TENDER MEDALLIONS" cutId="chuck" onClick={handleCutClick} />
            </div>
          </div>

          {/* Top Center - RIB */}
          <div className="col-span-2 flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">RIB</h3>
            <div className="flex flex-col space-y-4">
              <CutCircle name="RIB ROAST" cutId="ribeye" onClick={handleCutClick} />
              <CutCircle name="RIB STEAK" cutId="ribeye" onClick={handleCutClick} />
              <CutCircle name="RIBEYE ROAST" cutId="ribeye" onClick={handleCutClick} />
              <CutCircle name="RIBEYE STEAK" cutId="ribeye" onClick={handleCutClick} />
              <CutCircle name="BACK RIBS" cutId="ribeye" onClick={handleCutClick} />
            </div>
          </div>

          {/* Center - COW DIAGRAM */}
          <div className="col-span-4 flex justify-center">
            <svg viewBox="0 0 800 500" className="w-full max-w-lg h-auto">
              {/* Main cow silhouette with detailed sections */}
              <g>
                {/* HEAD & NECK */}
                <path
                  d="M100 200 C80 180, 80 140, 110 120 L140 110 Q160 105, 180 115 L200 130 Q210 140, 215 160 L210 190 Q205 210, 190 220 L160 230 Q140 225, 120 215 L100 200 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('chuck')}
                />
                <text x="160" y="150" textAnchor="middle" className="text-xl font-bold fill-white pointer-events-none">NECK</text>

                {/* CHUCK */}
                <path
                  d="M200 130 L215 160 L210 190 Q205 210, 190 220 L200 240 Q210 260, 220 270 L290 275 L310 260 L320 200 L300 140 Q280 120, 250 125 L200 130 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('chuck')}
                />
                <text x="255" y="190" textAnchor="middle" className="text-xl font-bold fill-white pointer-events-none">CHUCK</text>

                {/* RIB */}
                <path
                  d="M300 140 L320 200 L390 205 L400 130 Q350 110, 300 140 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('ribeye')}
                />
                <text x="350" y="170" textAnchor="middle" className="text-xl font-bold fill-white pointer-events-none">RIB</text>

                {/* SHORT LOIN */}
                <path
                  d="M400 130 L390 205 L480 210 L485 140 Q450 120, 400 130 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('short_loin')}
                />
                <text x="435" y="160" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none">SHORT</text>
                <text x="435" y="178" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none">LOIN</text>

                {/* TENDERLOIN (dashed inside short loin) */}
                <path d="M400 190 Q440 195, 470 195" stroke="white" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                <text x="435" y="200" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" opacity="0.8">TENDERLOIN</text>

                {/* SIRLOIN */}
                <path
                  d="M485 140 L480 210 L550 220 Q560 180, 540 150 L485 140 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('sirloin')}
                />
                <text x="515" y="185" textAnchor="middle" className="text-xl font-bold fill-white pointer-events-none">SIRLOIN</text>

                 {/* RUMP */}
                <path
                  d="M540 150 Q560 180, 550 220 L580 230 Q610 190, 580 150 L540 150 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('sirloin')}
                />
                <text x="565" y="190" textAnchor="middle" className="text-lg font-bold fill-white pointer-events-none">RUMP</text>
                
                {/* ROUND */}
                <path
                  d="M580 150 Q610 190, 580 230 L590 280 Q600 320, 580 340 L560 330 Q570 290, 620 250 Q650 200, 630 160 L580 150 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('round')}
                />
                <text x="595" y="230" textAnchor="middle" className="text-xl font-bold fill-white pointer-events-none">ROUND</text>

                {/* BREAST / BRISKET */}
                <path
                  d="M190 220 L200 240 Q210 260, 220 270 L290 275 L280 300 Q260 310, 240 305 L200 290 L160 230 L190 220 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('brisket')}
                />
                <text x="220" y="235" textAnchor="middle" className="text-lg font-bold fill-white pointer-events-none transform -rotate-10">BREAST</text>

                {/* SHORT PLATE */}
                <path
                  d="M310 260 L290 275 L310 320 L380 310 L390 205 L320 200 L310 260 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('plate')}
                />
                <text x="345" y="245" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none">SHORT</text>
                <text x="345" y="260" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none">PLATE</text>

                {/* FLANK */}
                <path
                  d="M380 310 L480 300 L480 210 L390 205 L380 310 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('flank')}
                />
                <text x="430" y="260" textAnchor="middle" className="text-xl font-bold fill-white pointer-events-none">FLANK</text>

                {/* SHANK */}
                <path
                  d="M200 290 L240 305 Q260 310, 280 300 L310 320 L280 350 Q260 360, 240 350 L200 320 L200 290 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('shank')}
                />
                <text x="240" y="330" textAnchor="middle" className="text-lg font-bold fill-white pointer-events-none">SHANK</text>
                
                 {/* REAR SHANK */}
                <path
                  d="M560 330 L580 340 Q600 320, 590 280 L480 300 L490 340 Q520 350, 560 330 Z"
                  fill="#722F37" stroke="#ffffff" strokeWidth="3"
                  className="cursor-pointer hover:fill-red-800 transition-colors duration-200"
                  onClick={() => handleCutClick('shank')}
                />
                <text x="535" y="320" textAnchor="middle" className="text-lg font-bold fill-white pointer-events-none">SHANK</text>
              </g>

              {/* Bottom Text */}
              <text x="200" y="300" textAnchor="middle" className="text-sm font-bold fill-gray-800 transform rotate(-10)">BRISKET &</text>
              <text x="200" y="315" textAnchor="middle" className="text-sm font-bold fill-gray-800 transform rotate(-10)">FORESHANK</text>

              <text x="390" y="340" textAnchor="middle" className="text-lg font-bold fill-gray-800">SHORTPLATE & FLANK</text>

            </svg>
          </div>

          {/* Top Right - LOIN */}
          <div className="col-span-2 flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">LOIN</h3>
            <div className="flex flex-col space-y-4">
              <CutCircle name="TOP LOIN STEAK" cutId="short_loin" onClick={handleCutClick} />
              <CutCircle name="T-BONE STEAK" cutId="short_loin" onClick={handleCutClick} />
              <CutCircle name="PORTERHOUSE STEAK" cutId="short_loin" onClick={handleCutClick} />
              <CutCircle name="TENDERLOIN ROAST" cutId="short_loin" onClick={handleCutClick} />
              <CutCircle name="FILET MIGNON" cutId="short_loin" onClick={handleCutClick} />
            </div>
          </div>

          {/* Middle Right - SIRLOIN */}
          <div className="col-span-2 flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">SIRLOIN</h3>
            <div className="flex flex-col space-y-4">
              <CutCircle name="SIRLOIN STEAK" cutId="sirloin" onClick={handleCutClick} />
              <CutCircle name="SIRLOIN STEAK BONELESS" cutId="sirloin" onClick={handleCutClick} />
              <CutCircle name="TOP SIRLOIN ROAST" cutId="sirloin" onClick={handleCutClick} />
              <CutCircle name="TRI-TIP ROAST" cutId="sirloin" onClick={handleCutClick} />
              <CutCircle name="TRI-TIP STEAK" cutId="sirloin" onClick={handleCutClick} />
            </div>
          </div>
        </div>

        {/* Right Side - ROUND */}
        <div className="flex justify-end mt-8 mr-8">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ROUND</h3>
            <div className="flex flex-col space-y-4">
              <CutCircle name="ROUND STEAK" cutId="round" onClick={handleCutClick} />
              <CutCircle name="BOTTOM ROUND STEAK" cutId="round" onClick={handleCutClick} />
              <CutCircle name="BOTTOM ROUND ROAST" cutId="round" onClick={handleCutClick} />
              <CutCircle name="EYE ROUND ROAST" cutId="round" onClick={handleCutClick} />
              <CutCircle name="EYE ROUND STEAK" cutId="round" onClick={handleCutClick} />
            </div>
            <div className="flex flex-col space-y-4 mt-4">
              <CutCircle name="TOP ROUND STEAK" cutId="round" onClick={handleCutClick} />
              <CutCircle name="BONELESS RUMP ROAST" cutId="round" onClick={handleCutClick} />
              <CutCircle name="TIP ROAST" cutId="round" onClick={handleCutClick} />
              <CutCircle name="TIP STEAK" cutId="round" onClick={handleCutClick} />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-3 gap-8 mt-12">
          {/* Bottom Left - BRISKET & FORESHANK */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">BRISKET & FORESHANK</h3>
            <div className="grid grid-cols-2 gap-4">
              <CutCircle name="BRISKET WHOLE" cutId="brisket" onClick={handleCutClick} />
              <CutCircle name="BRISKET FLAT HALF" cutId="brisket" onClick={handleCutClick} />
              <CutCircle name="BRISKET POINT HALF" cutId="brisket" onClick={handleCutClick} />
              <CutCircle name="SHANK CROSS CUT" cutId="shank" onClick={handleCutClick} />
            </div>
          </div>

          {/* Bottom Center - SHORTPLATE & FLANK */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">SHORTPLATE & FLANK</h3>
            <div className="flex space-x-4">
              <CutCircle name="SKIRT STEAK" cutId="plate" onClick={handleCutClick} />
              <CutCircle name="FLANK STEAK" cutId="flank" onClick={handleCutClick} />
            </div>
          </div>

          {/* Bottom Right - Empty for balance */}
          <div></div>
        </div>
      </div>
    </div>
  );
}
