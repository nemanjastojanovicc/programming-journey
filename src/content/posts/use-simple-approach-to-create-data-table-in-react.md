---
title: "Use Simple Approach to Create Data Table in React"
date: 2023-12-21T09:48:53+01:00
draft: false
description: "In this story we will try to create a reusable DataTable component using a simple way to pass the data and configure the table. 🚀 "
image: "/src/images/posts/02-react-data-table/final-table.png"
categories: ["react"]
tags: ["react", "typescript"]
---

In this story, we’ll embark on a journey to create a DataTable component in React. Data tables are a common requirement in web applications, and making them can be a challenging task.

Our goal is to build a simple component that we can reuse across an application to display various types of data.

We’ll start with the initial implementation and show the products. Those products will be in the following format:

```javascript
const PRODUCTS: Products = [
  {
    id: 1,
    discount: 25,
    available: false,
    materials: ["Wood", "Canvas"],
    name: "Canvas Painting",
    price: 199.99,
  },
  {
    id: 2,
    discount: 5,
    available: true,
    materials: ["Stainless Steel", "Plastic"],
    name: "Blender",
    price: 69.99,
  },

  //...
];
```

We can see that each product contains information about the `discount`, `availability`, `materials` it is made of, `name` and `price`.

Some product properties will be displayed in their original format, while others will be transformed.

<img src="/programming-journey/images/posts/02-react-data-table/02-data-table-2.webp" alt="The Data Table explanation" loading="lazy" decoding="async">

One of the easiest ways to implement our table and display product data would be:

```javascript
const ProductsTable: FC<ProductsTableProps> = ({ data }) => (
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Price</th>
        <th>Discount</th>
        <th>Availability</th>
        <th>Materials</th>
      </tr>
    </thead>
    <tbody>
      {data.map((product) => (
        <tr key={product.id}>
          <td>{product.name}</td>
          <td>${product.price}</td>
          <td>{product.discount}%</td>
          <td>{product.available ? "✅" : "❌"}</td>
          <td>{product.materials.join(", ")}</td>
        </tr>
      ))}
    </tbody>
  </table>
);
```

This doesn’t seem so bad, but what is the issue with this approach?

The issue is that our table component can only be used for `products`. What if we need to display users?

Creating a new table to display users is not a good idea. So we need a way to create a reusable table.

---

One way I’ve seen before and really liked is how Material has implemented [DataTable](https://mui.com/material-ui/react-table/#data-table) and [DataGrid](https://mui.com/x/react-data-grid/) components. They have separated the `data` and `column` properties so that we pass the data in the original format while the columns provide configuration on how the data will be displayed in our table.

So our columns can have these three properties:

- `fieldId`: specifies the unique identifier for the field in the data object (for our products, it can be a price, discount, available, materials…)
- `columnName`: column header for specific column
- `valueFormatter`: function that will transform specific field if needed

In other words, we could prepare our columns like this:

```javascript
const columns: ColumnItem<ProductItem>[] = [
  {
    fieldId: "name",
    columnName: "Name",
  },
  {
    fieldId: "price",
    columnName: "Price",
    valueFormatter: (value) => `$${value.toFixed(2)}`,
  },
  {
    fieldId: "discount",
    columnName: "Discount",
    valueFormatter: (value) => `${value}%`,
  },
  {
    fieldId: "available",
    columnName: "Availability",
    valueFormatter: (value) => (value ? "✅" : "❌"),
  },
  {
    fieldId: "materials",
    columnName: "Materials",
    valueFormatter: (value) => value.join(", "),
  },
];

const ProductsList: FC = () => (
  <DataTable<ProductItem> columns={columns} data={PRODUCTS} />
);
```

In this way, we defined that the first column of our table will be the **name** and the data will be in the original format, the second column will be the **price** in dollars, the third column will be the **discount** in percentages and finally we will show the **materials** separated by commas.

Now we have a reusable **DataTable** component that we can easily use in many places and display different data. So if we wanted to use our table to display users, we could do it like this:

```javascript
const columns: ColumnItem<User>[] = [
  {
    fieldId: "email",
    columnName: "Email",
  },
  {
    fieldId: "gender",
    columnName: "Gender",
    valueFormatter: (value) => <GenderCell gender={value} />,
  },
  {
    fieldId: "isVerified",
    columnName: "Verified",
    valueFormatter: (value) => <VerifiedCell verified={value} />,
  },
  {
    fieldId: "dateOfBirth",
    columnName: "Date of Birth",
    valueFormatter: (value) => new Date(value).toLocaleDateString(),
  },
];

const UserList: FC = () => (
  <DataTable<User> columns={columns} data={USERS} />
);
```

But now we need to figure out how to implement our table so that we can pass columns and data in this format.

---

We can start the implementation by separating the logic for **TableHead** and **TableBody** (later we’ll probably have **TablePagination** as well, but for now we just want to see how to display the data in the table).

```javascript
export type DataTableProps<T> = {
  columns: ColumnItem<T>[];
  data: T[];
  className?: string;
};

const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  className,
}: DataTableProps<T & { id: string | number }>): JSX.Element => (
  <table className={classNames("data-table", className)}>
    <TableHead columns={columns} />
    <TableBody columns={columns} data={data} />
  </table>
);

export default DataTable;
```

Regarding the **TableHead** component, for now it is enough to just display the `columnName` for each item in the columns:

```javascript
export type TableHeadProps<T> = Pick<DataTableProps<T>, "columns">;

const TableHead = <T extends Record<string, any>>({
  columns,
}: TableHeadProps<T>): JSX.Element => (
  <thead>
    <tr>
      {columns.map(({ columnName }) => (
        <th key={columnName}>{columnName}</th>
      ))}
    </tr>
  </thead>
);

export default TableHead;
```

However, the logic of the **TableBody** component is more complex, but the idea is simple:

- In the table we show an array of items
- One row of our table represents one item
- For each row, we will make as many cells as we have columns
- For each column we defined fieldId (which product property we are accessing) and valueFormatter (how to display that property value)

<img src="/programming-journey/images/posts/02-react-data-table/02-data-table-3.webp" alt="Table Body illustration" loading="lazy" decoding="async">

So our implementation of the **TableBody** component might look like this:

```javascript
const TableBody = <T extends Record<string, any>>({
  columns,
  data,
}: DataTableProps<T>): JSX.Element => (
  <tbody>
    {data.map((row) => (
      <tr key={row.id}>
        {columns.map((column) => (
          <td key={column.columnName}>{renderCell<T>(row, column)}</td>
        ))}
      </tr>
    ))}
  </tbody>
);

export default TableBody;
```

And we can implement the `renderCell` method as follows:

```javascript
export const renderCell = <T extends Record<string, any>>(
  row: T,
  column: ColumnItem<T>
): ReactNode => {
  const { fieldId, valueFormatter } = column;
  const cellValue = row[fieldId];

  return valueFormatter?.(cellValue, row) ?? cellValue;
};
```

Now we are done with the logic of our DataTable component and you can find complete code on [github repo](https://github.com/nemanjastojanovicc/ReactDataTable).

However, this is just a basic idea of how we can configure our table. In reality, we will need more column properties to make our table even more flexible, and we will also very likely need pagination, filters, sorting and so on.

---

Another interesting thing to mention is the **ColumnItem** type we used above. In the beginning I started with this type:

```javascript
export type ColumnItem<T> = {
  fieldId: keyof T;
  columnName: string;
  valueFormatter?: (value: T[keyof T], row: T) => React.ReactNode;
};
```

And this type is fine, the only thing I didn’t like about it is that the first parameter of the `valueFormatter` function is `T[keyof T]`.

Because in this way we didn’t say exactly what type is our value that we display in the table cell. We just said that it is some value of our Product type:

<img src="/programming-journey/images/posts/02-react-data-table/02-data-table-4.webp" alt="Product type issue" loading="lazy" decoding="async">

So in order to fix this we have to write `as ProductItem["price"]`:

It is not good practice that now whenever we use `valueFormatter` we have to write the `value as ObjectType[fieldId]` to use our types correctly, it would be great if the typescript itself recognizes the type based on the `fieldId` we wrote earlier.

And we can achieve that by using **MappedTypes** and **IndexedAccessTypes** in the following way:

```javascript
export type ColumnItem<T> = {
  [K in keyof T]: {
    fieldId: K;
    columnName: string;
    valueFormatter?: (value: T[K], row: T) => React.ReactNode;
  };
}[keyof T];
```

This way of defining types can have its own story, but let’s see what we have achieved by creating this type.

The type `ColumnItem<T>` is a mapped type that iterates over all keys `K` in `T`, which represent the keys of the object type `T`.

For each key `K`, it defines an object type with three properties:

- `fieldId`: specifies the unique identifier for the field in the data object
- `columnName`: holds the name of the column
- `valueFormatter`: represents an optional function to format the cell value. The type T[K] ensures that the function argument has the correct type for the field identified by K

By using this mapped type, TypeScript can automatically recognize the type of `valueFormatter` based on the `fieldId`, which can lead to more type-safe code.

**Conclusion**

In this story, we saw a simple way to create a reusable DataTable component. It is not the final implementation, but rather a basis that we can upgrade depending on our requirements.

In the end, I would like to share this quote:

> Reusability is not about building the perfect object,
> it’s about creating a flexible one.
>
> ~ Ralph Johnson

Thanks for reading and happy coding!
