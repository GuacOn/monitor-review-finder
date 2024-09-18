let apiKey = browser.storage.local.get("api_key");
apiKey.then(onGot, onError);
function onGot(item) {
  console.debug(item["api_key"]);

  console.log(`Extension ${manifest.name} v${manifest.version} starting...`);
  gumtreeReplaceTextByClass(item["api_key"], "vip-ad-title__header");
}

function onError(error) {
  alert("Please set your OpenAI API key in the extension settings.");
  console.log(`Error: ${error}`);
}

/**
 * Queries ad title + description, and supplements ad title with RTINGS data.
 * @param {string} apiKey OpenAI API key (https://platform.openai.com/api-keys)
 * @param {string} className Name of the class we will add information to
 */
async function gumtreeReplaceTextByClass(apiKey, className) {
  let elements = document.getElementsByClassName(className);
  let tasks = [];

  let adTitleElement = elements[0];
  let adTitleText = adTitleElement.textContent + "\n";
  let adDescriptionElement = document.getElementsByClassName(
    "vip-ad-description__content--wrapped",
  )[0];

  // Combine the two elements for our prompt
  let gptPromptAdText = adTitleText + adDescriptionElement.textContent;

  const popupDiv = document.createElement("div");
  popupDiv.style.display = "none";
  popupDiv.style.position = "relative";
  popupDiv.style.top = "30px";
  popupDiv.style.left = "7px";
  popupDiv.style.backgroundColor = "#555";
  popupDiv.style.color = "#fff";
  popupDiv.style.padding = "8px";
  popupDiv.style.borderRadius = "5px;";

  // const node = document.createTextNode("This is a new paragraph.");
  // popupDiv.appendChild(node);

  // Send to GPT for analysis
  tasks.push(
    GPTFetchMonitorModel(apiKey, gptPromptAdText).then(
      async function (modelNumber) {
        console.log("Calling func retrieved model number: " + modelNumber);
        // Search RTINGS API for monitor model
        let HTMLScorecardTable = await RTINGSSearch(modelNumber);
        if (HTMLScorecardTable) {
          // Add HTML scorecard table to our popupDiv
          popupDiv.appendChild(HTMLScorecardTable);
          let popupDivDesc = popupDiv.cloneNode(true);

          // Make ad title hover-able
          const elementToHover = adTitleElement;
          elementToHover.innerHTML = elementToHover.innerHTML.replace(
            modelNumber,
            `<a href="rtings.com">${modelNumber}</a>`,
          );
          adTitleElement.appendChild(popupDiv);
          const elementToPopup = popupDiv;

          elementToHover.addEventListener("mouseenter", () => {
            elementToPopup.style.display = "block";
          });

          elementToHover.addEventListener("mouseleave", () => {
            elementToPopup.style.display = "none";
          });

          // Make ad description hover-able
          const elementToHoverDesc = adDescriptionElement;
          elementToHoverDesc.innerHTML = elementToHoverDesc.innerHTML.replace(
            modelNumber,
            `<a href="rtings.com">${modelNumber}</a>`,
          );
          adDescriptionElement.appendChild(popupDivDesc);
          const elementToPopupDesc = popupDivDesc;

          elementToHoverDesc.addEventListener("mouseenter", () => {
            elementToPopupDesc.style.display = "block";
          });

          elementToHoverDesc.addEventListener("mouseleave", () => {
            elementToPopupDesc.style.display = "none";
          });
        }
      },
      function (error) {
        console.log("Calling func error: " + error);
      },
    ),
  );

  console.debug("Adding another task...");

  // Wait for all API calls to complete
  await Promise.all(tasks);

  console.log(`${manifest.name} has finished replacing elements on this page.`);
}
