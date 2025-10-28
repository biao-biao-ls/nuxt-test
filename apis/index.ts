import selectMyShoppingCart from  '../nuxt-test/selectMyShoppingCart.json';
import simpleOrder from  '../nuxt-test/simpleOrder.json';


export const getImEmployeeInfoByQuickCepId = async (quickCepId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    employeeNameEn: "Xie Yulang",
    imageFileIndexId: "8636932414868172800",
    roleNameEn: null,
    quickCepId: "1948591855846862849",
  };
};

export const imShoppingCartPage = async (...args) => {
  console.log(args);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return selectMyShoppingCart.data
};

export const orderCenterSimpleOrder = async (...args) => {
  console.log(args);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return simpleOrder.data
};
