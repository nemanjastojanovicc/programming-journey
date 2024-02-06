---
title: "Simplifying Code Complexity with Pipe Method"
date: 2023-11-22T16:55:24+01:00
draft: false
description: "JavaScript offers us a powerful tool to break down complex functions into smaller, manageable pieces. In this story, we’ll explore the pipe method and demonstrate its benefits through a real-world scenario."
image: "/images/posts/01-pipe-method/final-pipe.png"
categories: ["react"]
tags: ["cleancode", "javascript"]
---

In the world of modern web development, maintaining clean and efficient code is essential. As projects grow, so does the complexity of our functions. However, JavaScript offers us a powerful tool to break down these complex functions into smaller, manageable pieces. In this story, we’ll explore the pipe method and demonstrate its benefits through a real-world scenario.

This is a basic pipe illustration that we will get to later.

## Let’s start with the problem we need to solve:

_We want to calculate the final price of a purchase that a user has made while buying various products. Firstly, some of the products are eligible for discount, so we want to use a discount map in order to apply those discounts to the product’s original price. Next, we want to calculate the total sum of the discounted price. If the customer has a coupon, we need to take that into consideration as well. Finally, after calculating the price in one currency, and (if needed) converting it to some other, we deliver the final price to the customer._

![Problem Explanation](/programming-journey/images/posts/01-pipe-method/problem-explanation.webp)

**Data we’re working with:**

- **userPurchases:** represents a list of products that a user has purchased. Each item has a unique identifier (id), product name (name), price (price), and the currency of the price (currency).
- **DISCOUNT_MAP:** data structure called a Map that associates product IDs with discount percentages.
- **COUPON_USD:** discount coupon value in USD that the customer possesses, which can be subtracted from the total purchase price.
- **USD_TO_EUR:** constant holds the conversion rate for converting USD to EUR.

```javascript
const userPurchases = [
  {
    id: 101,
    price: 34.99,
    name: "Wireless Headphones",
    currency: "USD",
  },
  {
    id: 202,
    price: 149.95,
    name: "Digital Camera Kit",
    currency: "USD",
  },
  {
    id: 303,
    price: 19.99,
    name: "Home Gym Equipment",
    currency: "USD",
  },
];

const DISCOUNT_MAP = new Map([
  [101, 10],
  [303, 20],
  [404, 30],
]);

const COUPON_USD = 75;
const USD_TO_EUR = 0.94;
```

In our implementation, we’ll perform the following steps:

1. Calculate new prices based on the discount map.
2. Calculate the total sum of the products.
3. Subtract the value of the coupon.
4. Convert the result from USD to EUR.

Here’s the initial implementation:

```javascript
const calculateFinalPrice = (
  userPurchases,
  discountMap,
  userCoupon,
  conversionRate
) => {
  // Define a function to calculate the discounted price for an item.
  const calculateDiscount = (price, discount = 0) => {
    if (discount < 0 || discount > 100) return price;
    if (price < 0) return NaN;

    return price * ((100 - discount) / 100);
  };

  // Apply discounts to items using the discount map.
  const itemsWithDiscount = userPurchases.map((item) => ({
    ...item,
    price: calculateDiscount(item.price, discountMap.get(item.id)),
  }));

  // Calculate the total sum of prices for all items.
  const total = itemsWithDiscount.reduce((acc, item) => acc + item.price, 0);

  // Subtract the user's coupon value from the total.
  const totalAfterCoupon = total - userCoupon;

  // Convert to a specific currency.
  const finalPrice = totalAfterCoupon * conversionRate;

  return finalPrice;
};
```

Our calculateFinalPrice function solves our problem and if we look carefully we will see that we solve the problem by following these steps:

![Problem Illustration](/programming-journey/images/posts/01-pipe-method/problem-illustration.webp)

What is bad with this approach?

Our function is doing many things, we have solved all these steps in only one function. What will happen if we have more than 4 steps? And what if we notice a bug? We’ll have to find which part of our function is causing the problem.

So let’s see how else we could implement this logic.

---

## The Pipe Method

The pipe method allows us to split a large, complex function into smaller, composable functions.

In simpler terms, think of the pipe method as a car wash. At each stage (function) your car goes through a specific cleaning or treatment process. By the time it leaves the car wash, it’s shiny and ready, having gone through a series of steps in a pre-defined sequence.

![Car Wash pipe illustration](/programming-journey/images/posts/01-pipe-method/car-wash.webp)
Photo by [Freepic](https://www.freepik.com/free-vector/car-wash-isometric-colored-composition-four-steps-washing-red-car-vector-illustration_32742530.htm)

This is an example of simple implementation of this function I found [reduce composing software](https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d), which was introduced earlier by [Eric Elliot](https://medium.com/@_ericelliott):

```javascript
const pipe =
  (...fns) =>
  (arg) =>
    fns.reduce((v, fn) => fn(v), arg);
```

The idea is simple, combine multiple functions by applying them one after the other from left to right, using the output of the previous function as the input for the next.

For example, if you had functions A, B, and C, and you wanted to apply them to some data x in the order A -> B -> C, you could use pipe like this:

```javascript
const result = pipe(funcA, funcB, funcC)(x);
```

This approach makes code more readable, promotes easier testing of individual functions, and simplifies bug identification.

**Here’s how it works:**

1. pipe takes one or more functions as input, represented by (...fns). The ...fns part means you can provide any number of functions, separated by commas, and they will be treated as a list.

2. It returns a new function that can accept some input data, represented by (arg). This input data can be anything, like numbers, text, or more complex information.

3. Inside this new function, it uses reduce to apply each of the functions in the list to the input data, one after the other. Think of it as passing the input through a series of processing steps.

4. The reduce function takes care of this step-by-step processing. It starts with the original input, arg, and applies the first function from the list to it. Then, it takes the result and applies the next function, and so on, until it goes through all the functions in the list.

5. Finally, it returns the end result of applying all these functions to the input data.

---

Now, let’s apply these concepts. Here is the same logic but solved with a few smaller functions:

```javascript
// Define a function to calculate the discounted price for an item.
//
const calculateDiscount = (price, discount = 0) => {
  if (discount < 0 || discount > 100) return price;
  if (price < 0) return NaN;

  return price * ((100 - discount) / 100);
};

// Create a function that applies discounts to items using the
// discount map.
//
const applyDiscounts = (discountMap) => (items) =>
  items.map((item) => ({
    ...item,
    price: calculateDiscount(item.price, discountMap.get(item.id)),
  }));

// Define a function to calculate the total sum of prices for all items.
//
const calculateTotal = (items) =>
  items.reduce((total, item) => total + item.price, 0);

// Create a function to subtract the user's coupon value from the total.
//
const subtractCoupon = (coupon) => (total) => total - coupon;

// Convert to a specific currency.
//
const convertTo = (conversionRate) => (total) => total * conversionRate;

const calculateFinalPrice = (items, discountMap, coupon, conversionRate) =>
  pipe(
    applyDiscounts(discountMap),
    calculateTotal,
    subtractCoupon(coupon),
    convertTo(conversionRate)
  )(items);
```

You can try it on codepen:

<iframe height="300" style="width: 100%; height: 600px" scrolling="no" title="JavaScript’s Pipe Method" src="https://codepen.io/Nemanja-Stojanovic-the-bashful/embed/xxmPNPd?default-tab=js" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href="https://codepen.io/Nemanja-Stojanovic-the-bashful/pen/xxmPNPd">
  JavaScript’s Pipe Method</a> by Nemanja Stojanovic (<a href="https://codepen.io/Nemanja-Stojanovic-the-bashful">@Nemanja-Stojanovic-the-bashful</a>)
  on <a href="https://codepen.io">CodePen</a>.
</iframe>

We start from the data on User Purchases and in each step we apply a certain function and transform the data until we get the final result.

Something like this:

![Problem Step By Step](/programming-journey/images/posts/01-pipe-method/step-by-step.webp)

What are the benefits of this approach?

We have created several smaller, specialized functions that solve a specific problem. We can now use them in other places in our application. And we can test each function separately and think about the edge cases of each individually.

And if they are also Pure JavaScript functions, writing unit tests becomes much easier.

For example if we want to test our discount calculation function, we can do it this way:

```javascript
import { calculateDiscount } from "./calculateDiscount";

describe("calculateDiscount function", () => {
  it("should return the original price when the discount is negative", () => {
    const price = 100;
    const discount = -10;
    expect(calculateDiscount(price, discount)).toBe(100);
  });

  it("should return the original price when the discount is zero", () => {
    const price = 100;
    const discount = 0;
    expect(calculateDiscount(price, discount)).toBe(100);
  });

  // rest of the tests...
});
```

## Conclusion

By breaking down complex processes into smaller, testable units, we can improve code quality, reduce bugs, and make our codebases more understandable.

In the end, I would like to share these two sentences:

> Write programs that do one thing and do it well.
>
> Write programs to work together.
>
> ~ Doug McIlroy (Unix Philosophy)

Thanks for reading and happy coding!
