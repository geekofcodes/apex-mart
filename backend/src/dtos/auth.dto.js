import UserDTO from "./user.dto.js";

/**
 * Auth DTO - Shapes authentication related responses
 */
class AuthDTO {
  /**
   * Login/Register response payload
   */
  static authResponse(user, accessToken, refreshToken = null) {
    return {
      user: UserDTO.userResponse(user),
      accessToken,
      ...(refreshToken && { refreshToken }),
    };
  }
}

export default AuthDTO;
