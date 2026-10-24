export interface Account {
  id: number;
  code: string;
  name: string;
  printCode: string;
  parentAccountId: number | null;
}
