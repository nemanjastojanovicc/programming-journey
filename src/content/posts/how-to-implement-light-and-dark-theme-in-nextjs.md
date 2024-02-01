---
title: "How to Implement Light and Dark Theme in Nextjs"
date: 2022-04-04T05:00:00Z
author: "Nemca Dev"
categories: ["next"]
image: "/images/posts/04-light-dark/light-dark-main.png"
tags: ["nextjs", "css", "react", "typescript"]
draft: false
description: "In this story, we’ll see one of the ways to implement a Light & Dark theme in a NextJS application using CSS variables."
---

In this story, we’ll see **one of the ways** to implement a Light & Dark theme in a **NextJS** application **using CSS variables**.

Apart from the step-by-step implementation, we will also try to answer the questions **whether we need this functionality at all and are there any advantages of using only CSS for styling**.

## Should we implement the Light & Dark theme?

If you have started working on an application, creating a Light & Dark theme **is probably not your main feature**, but if you plan to have this functionality, it would be good if this is **one of the first things you will implement**.

Because it is much easier to define initial colors in the beginning, and later just add new colors as the project grows.

The next question we should answer is how do we want to add styles?

## Why CSS Modules?

There is no specific reason why I chose css modules, you can add styles in many ways and each has its advantages and disadvantages. Even when initializing the **NextJS** app you can choose **Tailwind**.

However, if you don’t have much experience in writing styles and want to improve it, `css` or `scss` will be a great choice because **that way you will learn fundamentals about styles**. We’ll need more time for, but we’ll learn much more.

After answering these questions, let’s start with the implementation.

---

## Initializing NextJS Application

To initialize the NextJS application, we’ll use the following command:

```shell
npx create-next-app@latest
```

In this way we’ll use the latest version of NextJS (currently it is **14.0.3**), after that you’ll see the following prompts:

```shell
What is your project named? my-app
Would you like to use TypeScript? No / Yes
Would you like to use ESLint? No / Yes
Would you like to use Tailwind CSS? No / Yes
Would you like to use `src/` directory? No / Yes
Would you like to use App Router? (recommended) No / Yes
Would you like to customize the default import alias (@/_)? No / Yes
What import alias would you like configured? @/_
```

Since we will be working with css, we will not choose Tailwind. For other things we can simply say yes.

After the prompts, `create-next-app` will create a folder with our project name and install the required dependencies.

The next thing could be adding initial colors.

---

## Adding CSS Variables

After we’ve set up the initial NextJS application, **we need to define the css variables we will use**.

> 💡 If you haven’t worked with CSS variables, think of them as containers that hold values we want to reuse in our styles. We give them names like --primary-color and later can access these variables using the CSS var(), for example var(--primary-color).

The good thing about this is that **if we want to change a color, we only need to do it in one place, and it automatically updates everywhere**.

We can start adding CSS variables in the _src/app/globals.css_ file:

```css
:root {
  --bgColor: white;
  --textColor: black;
  --primaryMainColor: #f37335;
  --primaryAccentColor: #fdc830;
}
```

> 💡 In CSS, :root is a pseudo-class that represents the highest-level parent element in the document hierarchy, which is usually the <html> element. The :root pseudo-class is commonly used to define global CSS variables, also known as custom properties.

We’ll also add `.light` and `.dark` classes:

```css
.light {
  --bg: white;
  --textColor: black;
  --primaryMainColor: #f37335;
  --primaryAccentColor: #fdc830;
}

.dark {
  --bg: #9ab4e4;
  --textColor: white;
  --primaryMainColor: #363795;
  --primaryAccentColor: #005c97;
}
```

In this way, by simply passing the `.light` or `.dark` class, we will actually update the colors through the application.

Before we move on to the next section, if you have problems creating your color palette, this site can help you:

![Color Hunt Website](/programming-journey/images/posts/04-light-dark/04-light-and-dark-2.webp)

[colorhunt.co](https://colorhunt.co/)

The next thing we should think about is where we will store information about the theme the user wants to use.

## Storing selected Theme in LocalStorage

We’ll simply store the chosen theme in the browser’s `localStorage`.

> 💡 The localStorage is a web development tool that lets developers store key-value pairs on a user's browser. It provides persistent storage, allowing data to be retained even when the browser is closed and reopened. This is commonly used for tasks like storing user preferences or caching data for improved performance.

This way, **when a user logs out and back in, their preferred theme will be remembered**.

One disadvantage of using `localStorage` is that the **stored data is device-specific**, so if the user opens the app on a different device, they may not see previously selected theme.

So we read value from localStorage and based on that we apply `light` or `dark` theme.

Now we need to implement logic for updating that value and **we’ll use React Context** for that purpose.

## Implementing ThemeContext in NextJS

If you haven’t worked with context before:

> 💡 In React, context provides a way to share values like state or functions across components without explicitly passing them through props at every level. It solves the issue of prop drilling, reduces code complexity when passing data through numerous intermediate components.

Let’s start with implementation, `ThemeContext` will serve as a central hub for theme-related data and actions.

```javascript
export type ThemeProviderProps = {
  children: React.ReactNode,
};

const ThemeContextProvider: FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState(getThemeFromLocalStorage);

  const toggleTheme = () =>
    setTheme((oldTheme) =>
      oldTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
    );

  useEffect(() => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  );
};
```

This way, we are allowing components throughout the application to seamlessly access and switch between light and dark themes.

We also added an `useEffect` hook to automatically update the local storage whenever the `theme` state changes, ensuring that the theme choice persists across page reloads or navigations.

```javascript
const isValidTheme = (value: string): value is Theme =>
  THEME_VALUES.includes(value);

const getThemeFromLocalStorage = (): Theme => {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const themeValue = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);

  if (themeValue && isValidTheme(themeValue)) return themeValue;

  return DEFAULT_THEME;
};

```

We initially call `getThemeFromLocalStorage` function to get the `theme` value from local storage:

- First we are checking whether window is defined in order to handle server-side rendering in NextJS where the window object is not defined during server-side execution.
- Checking whether the value we got from localStorage is valid and if so we return it.
- Otherwise we return the `DEFAULT_THEME` value.

In order to make our code more descriptive, we will also define `useThemeContext`:

```javascript
const useThemeContext = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useThemeContext must be used within a ThemeContextProvider"
    );
  }

  return context;
};
```

And finally, we’ll create the `ThemeContext` along with the types and default values.

```javascript
export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export const THEME_LOCAL_STORAGE_KEY = "theme";
export const DEFAULT_THEME = Theme.LIGHT;
export const THEME_VALUES: string[] = Object.values(Theme);

const DEFAULT_VALUE: ThemeContextData = {
  theme: DEFAULT_THEME,
  toggleTheme: () => {},
};

export type ThemeContextData = {
  theme: Theme;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextData>(DEFAULT_VALUE);
```

And now in order to complete the initial functionality, we need to create a **ToggleButton** component.

---

## Creating the ToggleButton

To switch between light and dark themes, we’ll need a `ToggleButton` component. This component will allow users to easily toggle between the themes, updating the `ThemeContext` state accordingly.

Implementation of the **ToggleButton component is not complicated** and can be implemented relatively easily.

I haven’t worked with the `framer-motion` library before, so I wanted to try it out and see how it works. So let’s see:

```javascript
const ToggleTheme: FC = () => {
  const { toggleTheme, theme } = useThemeContext();
  const isLightTheme = theme === Theme.LIGHT;

  return (
    <div
      onClick={toggleTheme}
      className={classNames("switch", { "switch--light": isLightTheme })}
    >
      <motion.div className="handle" {...TOGGLE_FRAMER_CONFIG}>
        <motion.svg
          key={theme}
          {...TOGGLE_SVG_PROPS}
          {...TOGGLE_SVG_FRAMER_CONFIG}
        >
          {isLightTheme ? (
            <motion.path d="M480-360q50 0 85-35t35-85q0-50-35-85t0..." />
          ) : (
            <motion.path d="M481.154-140.001q-141.666 0-240.832-99..." />
          )}
        </motion.svg>
      </motion.div>
    </div>
  );
};

export default ToggleTheme;
```

In this component, we use the previously created `useThemeContext` to manage the selected theme, and we also use `motion.div`, `motion.svg` and `motion.path` from the framer-motion library.

Using these elements allows us to pass the following properties related to animations:

```javascript
const TOGGLE_ICON_FRAMER_CONFIG = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.25 },
};

const SPRING_TRANSITION = { type: "spring", stiffness: 600, damping: 32 };

const TOGGLE_FRAMER_CONFIG = {
  layout: true,
  transition: SPRING_TRANSITION,
};
```

In this way, we animated our icons according to scale and opacity, but the properties that are interesting here are:

- `type`: can accept props Tween, Spring or Inertia. And spring type simulates spring physics for realistic motion.
- `stiffness`: Defines the stiffness of the spring, influencing the speed and force of the animation. Higher values will create more sudden movement. Set to `100` by default.
- `damping`: Strength of opposing force. If set to 0, spring will oscillate indefinitely. Set to `10` by default.
- `layout`: Indicating that the layout of the component should be animated. This means that changes in size or position will be smoothly animated rather than instantaneously applied.

And finally we’ll use svgs from [Google Fonts Icons](https://fonts.google.com/icons).

## Conclusion

In this story, we saw how we can implement the **Light & Dark** theme. How to define **CSS variables**, what **Local Storage** is for and how to create a **Theme Provider**. We also tried the **framer-motion** library for creating simple animations.

We covered a lot of things with this implementation. You can find whole code on [github](https://github.com/nemanjastojanovicc/LightAndDarkTheme).

I hope you enjoyed and found it useful
