[![Code Climate](https://codeclimate.com/github/shutterstock/juxtaposer.png)](https://codeclimate.com/github/shutterstock/juxtaposer)
[![Dependency Status](https://david-dm.org/shutterstock/juxtaposer.png)](https://david-dm.org/shutterstock/juxtaposer)
[![devDependency Status](https://david-dm.org/shutterstock/juxtaposer/dev-status.png)](https://david-dm.org/shutterstock/juxtaposer#info=devDependencies)
[![Stories in Ready](https://badge.waffle.io/shutterstock/juxtaposer.png?label=ready&title=Ready)](https://waffle.io/shutterstock/juxtaposer)


# juxtaposer

## Summary

Flexible image comparison tool primarily used to detect css changes.

## Installation


### Global Install

`npm install -g juxtaposer`

### Project Install:

`npm install --save-dev juxtaposer`

When installed for a single project, the binary is `./node_module/.bin/juxtaposer`


## Getting Started

**Step 1** Make a file in the root of your project called `juxtaposer.json` with the contents:

```json
{
  "imagesDir": "test_images",
  "substitutions": {
    "prod": {
      "query": "production"
    },
    "dev": {
      "query": "development",
    }
  }
}
```

**Step 2** Make a file in the root of your project called `targets.json` with the contents:

```json
#### targets.json
```json
[
  {
    "name": "sample_query.png",
    "url": "https://www.google.com/#q={{query}}",
  }
]
```

**Step 3** Run `juxtaposer --report`


**Step 4** Customize `juxtaposer.json` and `targets.json`

## Examples

### Basic Example

Create your config file:

#### juxtaposer.json
```json
{
  "imagesDir": "my_images",
  "substitutions": {
    "prod": {
      "subdomain": "www",
      "test_env": ""
    },
    "dev": {
      "subdomain": "testing",
      "test_env": "development."
    }
  }
}
```

Specify the targets:

#### targets.json
```json
[
  {
    "name": "photo_homepage.png",
    "url": "http://{{subdomain}}.{{test_env}}example.com/login",
  }
]
```

When you run the command `$ juxtaposer`, it will store the url `http://www.example.com/login` at `my_images/baselines/photo_homepage.png` and the url `http://testing.development.example.com/login` at `my_images/samples/photo_homepage.png` and then the two images are compared.


### advanced example

#### juxtaposer.json
```json
{
  "showReport": true,
  "export": true,
  "targetEnv": "staging",
  "baselineEnv": "production",
  "substitutions": {
    "production": {
      "subdomain": "www"
    },
    "staging": {
      "subdomain": "staging"
    }
  }
}
```

#### targets.json
```json
[
  {
    "name": "excluding_two_regions.png",
    "url": "http://{{subdomain}}.example.com",
    "exclude": [ ".stats_section", "#user-info" ]
  },
  {
    "name": "only_the_given_coordinates.png",
    "url": "http://{{subdomain}}.example.com",
    "only": [200, 0, 960, 50]
  },
  {
    "name": "only_the_content_div.png",
    "url": "http://{{subdomain}}.example.com",
    "only": "#content"
  },
  {
    "name": "narrow_view.png",
    "url": "http://{{subdomain}}.example.com",
    "width": 350
  }
]
```


### custom image capture scripts with jenkins

*TODO*


## Environment translations

The substitution values in the config file are used to build the url. It uses the swig template engine to build the urls.  Example:

For the url `http://{{subdomain}}.{{test_env}}example.com`
And the substitutions:

```json
"substitutions": {
  "prod": {
    "subdomain": "www",
    "test_env": ""
  },
  "qa": {
    "subdomain": "testing",
    "test_env": "qa."
  },
  "dev": {
    "subdomain": "testing",
    "test_env": "development."
  }
}
```

Will generate the following domains:

* `prod`: `http://www.example.com`
* `qa`: `http://testing.qa.example.com`
* `dev`: `http://testing.development.example.com`

*Note:* `test_env` for both `qa` and `dev` in this example have trailing `.`.


## Custom report templates

You can specify your own report template for the html report using the command line flag `--report-template` or with `reportTemplate` in the config file. The report template is rendered with the [swig template language](https://paularmstrong.github.io/swig/)

The following information will be passed to the template:

```json
{
  "settings": {
    "ranAt": "Tue, 06 May 2014 03:23:28 GMT", // timestamp when the tests ran
    "isBaselineNeeded": false,                // true if the baseline images were captured on this run
    "baselineEnv": "prod",                    // baseline environment
    "targetEnv": "dev",                       // target environment
    "cwd": "/Users/user/code"                 // directory where the test ran
  },
  "tests":  {
    "failed":  [
      {
        "prettyName":     "home page",
        "imageName":      "home_page.png",
        "baselinePath":   "baselines/home_page.png",
        "samplePath":     "samples/home_page.png",
        "diffsPath":      "diffs/home_page.png",
        "compositeImage": "diffs/home_page.comp.png",
        "changesImage":   "diffs/home_page.changes.png",
        "animateImage":   "diffs/home_page.animated.gif",
      },
      {
        //...
      }
    ],
    "skipped": [
      {
        //...
      }
    ]
    "success": [
      {
        "prettyName":   "google homepage",
        "imageName":    "google_homepage.png",
        "baselinePath": "baselines/google_homepage.png",
        "samplePath":   "samples/google_homepage.png",
        "diffsPath":    "diffs/google_homepage.png",
      }
    ]
  }
}

```

## Composite Image Types

*TODO provide examples*

### Changes

### Animated

### Composite

### Diff


## Targets

The `targets.json` file is a list of urls you want to compare. It's a json array of objects. Each target must have a url and a file name. Only the file name needs to be unique.

#### url

*Required*

Value: `string`

The url of the target.

#### fileName

*Required*

Value: `string`

the file name where the screen shot will be stored.

#### width

Value: `integer`

The width of the view port for rendering the page.

#### only

Value: `string` or `array`

If the value is a string, it is the css selector used to select the element to be captured. Only the first match will be used for the screenshot.

Uses the method [`querySelector`](https://developer.mozilla.org/en-US/docs/Web/API/Element.querySelector)

If the value is an array, it is the used as the coordinates of the screenshot region. The array must have 4 integer elements elements: [`left`, `top`, `height` `width`]

#### exclude

Value: `array`

An array of css selectors of regions to ignore. Any element that matches any of the css selectors will not be included in compairing the baseline to the sample image.

*Warning* Any match will be ignored. For example `'div'` will ignore all divs on both pages.

Uses the method [`querySelectorAll`](https://developer.mozilla.org/en-US/docs/Web/API/Element.querySelectorAll)

#### fuzz

Value: `integer`

Default: `20`

The percent of tolerance to allow between two images. A value of `100` will ignore all differences between the two. Only useful if the two pages contain similar images. [More Info](http://www.imagemagick.org/Usage/bugs/fuzz_distance/)


## config file settings

#### targetEnv

Value: `string`

Default: `dev`

The environment information used to capture the sample images. [Please see the substitutions config for more info](#custom-report-templates).

#### baselineEnv

Value: `string`

Default: `prod`

The environment information used to capture the baseline images. [Please see the substitutions config for more info](#custom-report-templates)

#### testOnly

Value `boolean`

Default `false`

If `testOnly` is true, it will skip the capturing of images and only compare images in the `baselineDir` with the images in the `samplesDir`. This is useful if you want to use your own scripts to capture the images.

#### showReport

Value `boolean`

Default `false`

Auto open the html report when run is completed. Only works on a mac for now.

#### reportTemplate

Value `string`

Default `N/A`


The path relative from the current directory to the html file. The template language used is [swig](https://paularmstrong.github.io/swig/). See the custom template section below.

#### export

Value `boolean`

Default `false`

Create a zip file of the images captured and the html report.

#### exportPath

Value: `string`

Default: `jux-{{base_env}}-vs-{{sample_env}}-{{date}}.zip`

The path and filename relative to the current working directory. The string is evaluated with the [swig](https://paularmstrong.github.io/swig/) template language. The following values are passed passed into the path:

* `base_env`: The name of the base env.
* `sample_env`: The name of the sample env.
* `date`: The timestamp of the test run in ISO format

#### imagesDir

Value: `string`

Default: `test_images`

The directory used to store all the images collected. It is resolved relative to the current working directory.


#### baselinesDir

Value: `string`

Default: `baselines`

The folder for the baseline images. It is resolved relative to the `imagesDir`.

#### samplesDir

Value: `string`

Default: `samples`

The folder for the sample images. It is resolved relative to the `imagesDir`.

#### diffsDir

Value: `string`

Default: `diffs`

The folder for the diff images. It is resolved relative to the `imagesDir`.

#### substitutions

Value: `object`

Default: `an empty object`

A key value pair of the environment names and the translation values. See the environment substitutions for more info.

## command line flags

#### --config

Value `string`

Default: `juxtaposer.json`

Overrides the path used for loading the config file.

#### --env

Value: `string`

Overrides: `targetEnv`

#### --base-env

Value: `string`

Overrides: `baselineEnv`

#### --test-only

Value: `boolean`

Overrides: `testOnly`

#### --report

Value: `boolean`

Overrides: `showReport`

#### --report-template

Value: `string`

Overrides: `reportTemplate`

#### --export

Value: `boolean`

Overrides: `export`

#### --export-path

Value: `string`

Overrides: `exportPath`

## Flow

1. Runs the prechecks
    1. checks to make sure imagemagick is installed
    1. ensures the directory structure is there
    1. checks to see if it needs to capture the baseline images
1. Cleans up the directories
    1. This step can be skipped with the flag `--test-only`
    1. removes png's and gif's from `samplesDir` and `diffsDir`
    1. If baseline images are going to to be captures, it removes png's from the `baselinesDir`
1. Images are captured
    1. This step can be skipped with the flag `--test-only`
    1. the baseline images are only captured if the `baselinesDir` is empty or the flag `--base-env=SOME_VALUE` is passed
    1. The command `populateCmd` will be called for both the samples and the baseline images
    1. For each target in the config file, it does the following:
        1. Sets the size of the viewport
        1. Captures the region if one is specified.
        1. Records the dimentions of excluded sections.
        1. Saves the image.
1. Images are tested.
    1. Every png in `baselinesDir` is compared against the png of the same name in `samplesDir`
    1. If a baseline images doesn't match the sample image, a series of images diffs are made in `diffsDir`
    1. If there is not a sample image for a baseline image, that image is marked as skipped
1. Results are recored
    1. The results are displayed in the command line
    1. The html report is generated and saved at the path: `{{imagesDir}}/{{reportPath}}`
    1. The template for the html report can be changed with the flag `--report-template`. The path will be relative form the working dir.
    1. If the flag `--report` is passed, the html report will be opened with the command: `open {{imagesDir}}/{{reportPath}}`
1. Results are exported in a zip file
    1. This step will only happen if the flag `--export` is used
    1. The contents of `imagesDir` will be added to a zip file.
    1. If you want to customize the path, you can specify a path relative to the working dir i.e. `--export-path=../archives/{{data}}.zip`



## License

Copyright (C) 2014 by Shutterstock Images, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
