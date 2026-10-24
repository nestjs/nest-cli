export const loadFoo = () => import('~/foo');
export type LazyBar = import('~/bar').Bar;
