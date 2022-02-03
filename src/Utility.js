export const restaurantOptions = [
    {
        key: 1,
        value: 1,
        text: "Restaurant 1"
    },
    {
        key: 2,
        value: 2,
        text: "Restaurant 2"
    },
    {
        key: 3,
        value: 3,
        text: "Restaurant 3"
    },
    {
        key: 4,
        value: 4,
        text: "Restaurant 4"
    },
    {
        key: 5,
        value: 5,
        text: "Restaurant 5"
    },
    {
        key: 6,
        value: 6,
        text: "Restaurant 6"
    },
    {
        key: 7,
        value: 7,
        text: "Restaurant 7"
    },
    {
        key: 8,
        value: 8,
        text: "Restaurant 8"
    },
    {
        key: 9,
        value: 9,
        text: "Restaurant 9"
    },
    {
        key: 10,
        value: 10,
        text: "Restaurant 10"
    }
]

export async function getData(url="") {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-cache"
    });
    return response.json();
}

export async function postData(url="", data={}) {
    const response = await fetch(url, {
        method: "POST",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if(response.ok) {
        return response.json();
    }
    else {
        throw response.json();
    }
}

