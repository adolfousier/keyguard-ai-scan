const Footer = () => {
  return (
    <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            v0.2.5 (2025-10-04) • Built with ❤️ by the security team •
            <a
              href="https://meetneura.ai"
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Neura AI
            </a>
          </p>
          <p className="text-sm">
            Automated penetration testing for modern web applications.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;