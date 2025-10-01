const Footer = () => {
  return (
    <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            v0.2.2 (2025-10-01) • Built with ❤️ by the security team •
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
            Help protect the web, one scan at a time.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;