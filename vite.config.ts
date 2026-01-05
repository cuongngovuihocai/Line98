import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // <--- BẮT BUỘC PHẢI CÓ DÒNG NÀY

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/Line98/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    // Dòng dưới đây là quan trọng nhất để sửa lỗi build:
    plugins: [react()], 
    
    define: {
      // Đoạn này giữ nguyên logic của bạn
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
