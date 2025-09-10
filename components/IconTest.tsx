// Test to check available icons
import * as HiIcons from 'react-icons/hi';

console.log('Available icons:', Object.keys(HiIcons).filter(key => key.startsWith('Hi')).slice(0, 20));

export default function IconTest() {
  return <div>Icon test</div>;
}
