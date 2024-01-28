---
title: "Optimistic Updates in Tanstack Query V5"
date: 2023-12-21T09:51:02+01:00
image: "/src/images/posts/03-optimistic-updates/optimistic-main.png"
draft: false
categories: ["react"]
tags: ["tanstack query", "react", "javascript"]
description: "Tanstack Query released version 5 with a number of changes and some interesting features, offering an even more powerful toolkit for developers."
---

**Tanstack Query** released **version 5** with a number of changes and some interesting features, offering an even more powerful toolkit for developers.

One of the novelties is a simpler way to perform optimistic updates **without** having to write code that **updates the cache manually**.

At first I thought the new way was a replacement for the old one. However, it turns out that **we can use both approaches**.

In this story, we’ll try to figure out when to use each of them, but first, let’s see if we even need the Optimistic Update?

---

**Do we need Optimistic Update?**

In web development, when users interact with a website (such as clicking or entering data), **we often need to send requests to a server** in the background. After that, we have to wait for the server to process those requests and send responses back, allowing communication between the UI and the server.

![Sending Requests](/programming-journey/images/posts/03-optimistic-updates/03-tq-optimistic-updates-2.webp)

Now imagine a scenario where we have a **toggle button** that `enables` or `disables` a feature. Initially some feature is disabled, and we want to enable it, but after clicking on the toggle button **we wait for the request** to be processed on the server and only after a few seconds the toggle button is turned on.

![Toggle Button main issue](/programming-journey/images/posts/03-optimistic-updates/03-tq-optimistic-updates-3.webp)

**And this is fine, if our requirements are such that we can show some kind of loader or skeleton** until we get a response from the backend.

But what if our requirements are such that we need to **quickly display** the result to the user, in order to improve the user experience?

---

**Optimistic Update**

Optimistic update is a technique used in web development to enhance the user experience. Sometimes, in order to make our application feel faster to users, **we can assume that certain operations will succeed** and update the UI immediately, without waiting for confirmation from the server.

This can create a smoother user interface by providing immediate feedback to users

So instead of waiting for the server’s response to reflect the change in the UI, **we can optimistically update our toggle button’s state as soon as the user interacts with it**. If the server operation succeeds, the user won’t notice any delay.

![Toggle Button solution](/programming-journey/images/posts/03-optimistic-updates/03-tq-optimistic-updates-4.webp)

In other words, we assume that our request will be successful and that we will probably be right in most situations.

**However, what if request fails?**

**We can implement the error handler logic** that will inform the user that an error has occurred and display the previous and valid state.

![Toggle Button error handler](/programming-journey/images/posts/03-optimistic-updates/03-tq-optimistic-updates-5.webp)

And finally, let’s see how we can implement this using Tanstack Query.

---

**First approach — Via the Cache**

This was the standard way to implement Optimistic Update and it was necessary to manually update the cache and rollback it to its previous state if an error occurred.

Implementation follows these steps:

- before we start the optimistic update, cancel any outgoing refetches for that data so that they don’t overwrite cache
- save the current state in the cache
- optimistically update the cache with the new value
- implement error logic (rollback to the previous state of the cache and we can also display an error notification)
- finally, if we want to be sure that our UI displays identical data as on the backend, invalidate the cache so that Tanstack Query in the background sends a request and updates the cache with the value from the backend

And in order to use this approach we will need to implement **onMutate**, **onError** and **onSettled** functions.

**onMutate** — this function will fire before the mutation function is fired and is passed the same variables the mutation function would receive.

```javascript
const onMutate = async (variables) => {
  // Cancel any outgoing refetches for that `queryKey`
  await queryClient.cancelQueries({ queryKey });

  // Snapshot the previous value
  const prevData = queryClient.getQueryData(queryKey);

  // Generate new data based on `prevData` and `variables`
  const newData = { ...prevData, feature: variables };

  // Optimistically update to the new value
  queryClient.setQueryData(queryKey, newData);

  // Return a context with the previous and new data
  return { prevData, newData };
};
```

**onError** — this function will be triggered if an error occurs.

```javascript
const onError = (error, variables, context) => {
  // Rollback to the previous status in case of an error
  queryClient.setQueryData(queryKey, context.prevData);

  // Display the appropriate error message
  showNotification(error);
},
```

**onSettled** — this function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error

```javascript
const onSettled = () => {
  // Invalidate the query to refetch the latest data
  queryClient.invalidateQueries({ queryKey });
};
```

So in the end our implementation for toggle button could look like this:

```javascript
const { data } = useQuery({ queryKey, ...rest });

const { mutate: toggleFeature } = useMutation({
  mutationFn,
  onMutate,
  onError,
  onSettled,
  ...additionalOptions,
});

return (
  <ToggleButton
    onClick={() => toggleFeature(!data.feature)}
    enabled={!!data.feature}
  />
);
```

See the complete code on the [github](https://github.com/nemanjastojanovicc/optimistic-update-tanstack-query).

---

**Second approach — Via the UI**

The new approach, allows us to update our UI **without directly interacting with the cache**.

Instead, in the new version, we can use `variables` and `isPending` values that we get from the **useMutation** hook in order to implement optimistic update.

Let’s explain them:

- **variables**: the argument we passed to the mutate (in our case toggleFeature) function
- **isPending**: whether the request is currently being executed

And finally, new implementation could look like this:

```javascript
const { data } = useQuery({ queryKey, ...rest });

const { mutate, variables, isPending } = useMutation({
  mutationFn,
  onError: showNotification,
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
});

const isEnabled = isPending ? variables : data.feature;

return (
  <ToggleButton
    onClick={() => toggleFeature(!data.feature)}
    enabled={!!isEnabled}
  >
);
```

By using this approach, we have significantly reduced the amount of code needed to implement optimistic updating.

**But if this approach is so much better, why would we still use the first approach where we have to worry about cache?**

The thing is that we used a simple example and in our case the second approach is better.

However let’s say on our page we display a **list of products sorted by price**, and the user can update the price of the product.

So when user updates the price of a product, it will be necessary to:

- update the specific product in the array and then
- sort the array again by price

The implementation might look like this:

```javascript
const { data = [] } = useQuery({ queryKey, ...rest });
const { mutate, variables, isPending } = useMutation({ ... });

const updateProducts = products =>
  products.map(product => {
    const isUpdatedItem = product.id === variables.id;
    if (!isUpdatedItem) return product;

    return { ...product, price: variables.price };
  });

const sortProductsByPrice = products =>
  products.sort((a, b) => a.price - b.price);

const updateAndSortProducts = (data) =>
  pipe(updateProducts, sortProductsByPrice)(data);

const finalProducts = isPending ? updateAndSortProducts(data) : data;

return (
  <ProductsList products={finalProducts} />
);
```

So in this way **we got a more complex logic on the UI side**, while before we had that logic in the **onMutate** function. So here we might prefer to use the first approach.

And we should also keep in mind:

> If you have multiple places on the screen that would require to know about the update, manipulating the cache directly will take care of this for you automatically.
>
> ~ Tanstack Query documentation

**Conclusion**

Both the first and second approaches have their advantages and disadvantages, **it is up to us to figure out which approach is more appropriate for our problem**.

> Every optimistic update has the drawback that you need to do the logic you usually do on the server on the client as well.
>
> ~ Dominik D (Tanstack Team)

I think the Tanstack Team has done a great job with this library so far, and I look forward to the new features.

What are your experiences with this library? Are you using any other library for this purpose?

I hope you found this useful. Happy Coding!
