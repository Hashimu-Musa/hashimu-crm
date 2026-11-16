export function organizationScope(user, extra = {}) {
  return {
    organizationId: user.organizationId,
    ...extra,
  };
}

export function routeParamId(req) {
  return req.params.id;
}
