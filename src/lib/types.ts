type ResultItem = {
  body?: string;
  path?: string;
  id: string;
  title: string;
  date: Date;
  description: string;
  tags?: string[];
};

import type { FuseResult } from "fuse.js";

type SearchResults = {
  writing: FuseResult<ResultItem>[];
  pages: FuseResult<ResultItem>[];
};
