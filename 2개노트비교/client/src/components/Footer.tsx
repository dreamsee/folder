export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-sm text-neutral-500 text-center">
          © {currentYear} 두개의 노트 비교 애플리케이션
        </p>
      </div>
    </footer>
  );
}
