import watermelonLogo from '@assets/Watermelon_WW_Logo_Square_1750971640089.png';

export const WatermelonLogo = () => {
  return (
    <div 
      className="category-image" 
      style={{
        backgroundImage: `url(${watermelonLogo})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f8f9fa',
        backgroundPosition: 'center',
        height: '150px'
      }}
    />
  );
};