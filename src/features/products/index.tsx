import type { ReactElement } from "react";
import { ProductsResource } from "./resources/products";
import { PublishersResource } from "./resources/publishers";

export const resources = [ProductsResource, PublishersResource];
export const routes: ReactElement[] = [];
