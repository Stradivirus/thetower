/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 애니메이션 키프레임 정의
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      // 애니메이션 유틸리티 클래스 등록
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-down": "fade-in-down 0.3s ease-out",
      },
    },
  },
  plugins: [],
}