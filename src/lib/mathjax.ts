// MathJax lazy loader singleton — only loaded when a page contains math
let setupPromise: Promise<{
  tex2svg: (tex: string, display: boolean) => string;
}> | null = null;

export function loadMathJax() {
  if (!setupPromise) {
    setupPromise = (async () => {
      const [
        { mathjax },
        { TeX },
        { SVG },
        { liteAdaptor },
        { RegisterHTMLHandler },
        { AllPackages },
      ] = await Promise.all([
        import('mathjax-full/js/mathjax.js'),
        import('mathjax-full/js/input/tex.js'),
        import('mathjax-full/js/output/svg.js'),
        import('mathjax-full/js/adaptors/liteAdaptor.js'),
        import('mathjax-full/js/handlers/html.js'),
        import('mathjax-full/js/input/tex/AllPackages.js'),
      ]);

      const adaptor = liteAdaptor();
      RegisterHTMLHandler(adaptor);

      const doc = mathjax.document('', {
        InputJax: new TeX({ packages: AllPackages }),
        OutputJax: new SVG({ fontCache: 'none' }),
      });

      return {
        tex2svg(tex: string, display: boolean): string {
          const node = doc.convert(tex, { display });
          return adaptor.outerHTML(node);
        },
      };
    })();
  }
  return setupPromise;
}
