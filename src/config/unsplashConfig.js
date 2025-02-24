import { createApi } from "unsplash-js";
console.log(process.env.REACT_APP_UNSPLASH_ACCESS_KEY);
const unsplash = createApi({
  accessKey: "K02DXTmdjWB_yp3zIN4vbZNX53pBu4v_6PJQ5whPr_I",
});

async function fetchBackgroundImage(query = "drawings") {
  try {
    const response = await unsplash.photos.getRandom({
      query: "code",
      orientation: "landscape",
    });
    if (response.errors) {
      console.error("Unsplash API Error:", response.errors);
      return null;
    }
    return response.response.urls.full;
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return null;
  }
}

export async function setBackgroundImage() {
  const imageUrl = await fetchBackgroundImage();
  if (imageUrl) {
    document.body.style.background = `url(${imageUrl}) no-repeat center center fixed`;
    document.body.style.backgroundSize = "cover";
  }
}
