const pathJS = require("path");
const parentPath = "outts";
module.exports = function babelPluginTransformHttpVerbs({ types: t }) {
  const httpVerbs = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

  return {
    visitor: {
      Program(path, state) {
        const routerVariable = t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("router"),
            t.callExpression(t.identifier("Router"), [])
          ),
        ]);
        path.node.body.unshift(routerVariable);

        const routerImport = t.importDeclaration(
          [t.importSpecifier(t.identifier("Router"), t.identifier("Router"))],
          t.stringLiteral("express")
        );
        path.node.body.unshift(routerImport);

        //add this expression only in files under routes folder
        if (state.file.opts.filename.includes("routes")) {
          path.node.body.push(
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                t.memberExpression(
                  t.identifier("module"),
                  t.identifier("exports")
                ),
                t.identifier("router")
              )
            )
          );
        }

        // Save the current file path to state for later use
        state.filePath = state.file.opts.filename;
      },
      ExpressionStatement(path, state) {
        //run this if file name containts .route. or .route. and js or ts extension
        if (
          !state.filePath.includes(".route.") ||
          !state.filePath.match(/\.route\.(js|ts)$/)
        ) {
          return;
        }

        const expression = path.node.expression;
        if (t.isCallExpression(expression)) {
          const callee = expression.callee;
          if (t.isIdentifier(callee) && httpVerbs.includes(callee.name)) {
            const verb = callee.name.toLowerCase();
            const callback = expression.arguments[0];

            // Calculate the relative path from the "src" directory
            // const srcPath = pathJS.resolve(state.filePath, "../src");

            // path from the src folder
            const srcFolderPath = pathJS.join(__dirname, "../", parentPath);

            //get relative path from src folder

            const relativePath = pathJS
              .relative(srcFolderPath, state.filePath)
              .replace(/\\/g, "/");

            //remove .route.js extension or .route.ts extension
            const formattedPath = `/${relativePath.replace(
              /\.route\.(js|ts)$/,
              ""
            )}`; // Remove ".js" extension and add leading "/"

            // const formattedPath = `/${relativePath.replace(/\.js$/, "")}`; // Remove ".js" extension and add leading "/"

            path.replaceWith(
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier("router"),
                    t.identifier(verb)
                  ),
                  [t.stringLiteral(formattedPath), callback]
                )
              )
            );
          }
        }
      },
    },
  };
};
