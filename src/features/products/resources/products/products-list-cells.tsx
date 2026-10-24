import { useRecordContext } from "react-admin";
import { Box, Typography } from "@mui/material";
import type { ProductListItem } from "@/types/product";
import { PRODUCT_TYPE_BOOK, PRODUCT_TYPE_GARMENT } from "./product-constants";

/** The catalogue list's cells, for its page and its pane layouts. */

type Names = Map<number, string | null>;

/** "Uniforme · Unisex": what the line is. */
const kindOf = (record: ProductListItem, types: Names, genders: Names) =>
  [
    types.get(record.productTypeId),
    record.productTypeId === PRODUCT_TYPE_GARMENT
      ? genders.get(record.garmentGenderId ?? -1)
      : null,
  ].filter(Boolean);

const versionsText = (count: number) =>
  `${count} ${count === 1 ? "versión" : "versiones"}`;

/** Name over a caption; the caption carries the columns the pane has not. */
export const ProductCell = ({
  types,
  genders,
  compact,
}: {
  types: Names;
  genders: Names;
  compact: boolean;
}) => {
  const record = useRecordContext<ProductListItem>();
  if (!record) return null;
  const meta = compact
    ? [
        ...kindOf(record, types, genders),
        versionsText(record.versionCount),
        record.isActive ? null : "inactivo",
      ].filter(Boolean)
    : record.isActive
      ? []
      : ["Inactivo"];
  return (
    <Box minWidth={0}>
      <Typography variant="body2" fontWeight={500} noWrap>
        {record.name}
      </Typography>
      {meta.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          component="div"
        >
          {meta.join(" · ")}
        </Typography>
      )}
    </Box>
  );
};

export const KindCell = ({
  types,
  genders,
}: {
  types: Names;
  genders: Names;
}) => {
  const record = useRecordContext<ProductListItem>();
  if (!record) return null;
  return (
    <Typography variant="body2" color="text.secondary" noWrap>
      {kindOf(record, types, genders).join(" · ")}
    </Typography>
  );
};

export const VersionsCell = () => {
  const record = useRecordContext<ProductListItem>();
  if (!record) return null;
  return (
    <Typography variant="body2" color="text.secondary" noWrap>
      {versionsText(record.versionCount)}
    </Typography>
  );
};

export const OfferCell = ({
  offers,
  loading,
}: {
  offers: Map<number, number>;
  loading: boolean;
}) => {
  const record = useRecordContext<ProductListItem>();
  if (!record || loading) return null;
  const count = offers.get(record.id) ?? 0;
  if (count === 0) {
    return (
      <Typography
        variant="caption"
        fontWeight={600}
        noWrap
        // warning.dark falls under 4.5:1 on the dark theme's paper.
        sx={(theme) => ({
          color:
            theme.palette.mode === "dark"
              ? theme.palette.warning.light
              : theme.palette.warning.dark,
        })}
      >
        Sin precio
      </Typography>
    );
  }
  const unit =
    record.productTypeId === PRODUCT_TYPE_GARMENT
      ? count === 1
        ? "talla"
        : "tallas"
      : record.productTypeId === PRODUCT_TYPE_BOOK
        ? count === 1
          ? "grado"
          : "grados"
        : null;
  return (
    <Typography variant="caption" color="text.secondary" noWrap>
      {unit ? `${count} ${unit}` : "A la venta"}
    </Typography>
  );
};
