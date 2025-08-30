import DocsPage, { getStaticProps as DocsPageStaticProps } from "./[...path]";

export async function getStaticProps() {
  return DocsPageStaticProps({ params: { path: ["index"] } });
}
export default DocsPage;
