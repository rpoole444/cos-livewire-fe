declare module 'nprogress' {
  const NProgress: {
    start: () => void;
    done: () => void;
    configure: (options: {
      minimum?: number;
      easing?: string;
      speed?: number;
      trickle?: boolean;
      trickleSpeed?: number;
      showSpinner?: boolean;
      parent?: string;
      template?: string;
    }) => void;
  };

  export default NProgress;
}
