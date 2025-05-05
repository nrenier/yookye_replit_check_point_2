from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ..utils.auth import login_required
from ..models.repositories import SavedPackageRepository # Import the repository
from ..models.models import SavedPackage # Import the model
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

saved_packages_bp = Blueprint('saved_packages', __name__)

# Initialize repository
saved_package_repository = SavedPackageRepository()

@saved_packages_bp.route('', methods=['POST']) # Corrected route to match /api/saved-packages
@cross_origin() # Consider handling CORS globally in app.py
@login_required
def save_package(current_user):
    """Saves a user-composed package."""
    data = request.json
    if not data:
        logger.warning(f"User {current_user.get('username','N/A')} sent empty data for saving package.")
        return jsonify({'message': 'Invalid input: missing package data'}), 400

    user_id_str = str(current_user.get('_id')) if current_user and current_user.get('_id') else None
    if not user_id_str:
         logger.error("Authenticated user has no _id.")
         return jsonify({'message': 'Authentication error: user ID not found'}), 500

    try:
        # Prepare data for SavedPackage model
        package_data = data.copy() # Make a copy to avoid modifying original request data
        package_data['userId'] = user_id_str

        # Set default savedAt timestamp
        package_data['savedAt'] = datetime.utcnow().isoformat()

        # Ensure an ID exists
        if 'id' not in package_data or not package_data.get('id') or package_data.get('id', '').startswith('composed-'):
            package_data['id'] = str(uuid.uuid4())

        # Create SavedPackage model instance for validation and structure
        # This will also add the default 'savedAt' field
        saved_package_model = SavedPackage(**package_data)

        # Save using the repository
        # The repository's create method handles converting the model back to dict
        created_package = saved_package_repository.create(saved_package_model)

        logger.info(f"Successfully saved package {created_package.id} for user {user_id_str}.")
        # Return the saved package data (excluding potentially sensitive fields if needed)
        return jsonify({
            'message': 'Package saved successfully',
            'savedPackage': created_package.model_dump() # Use model_dump for Pydantic v2+
        }), 201

    except Exception as e:
        logger.error(f"Error saving package for user {user_id_str}: {e}", exc_info=True)
        return jsonify({'message': 'Error saving package', 'error': str(e)}), 500

@saved_packages_bp.route('', methods=['GET']) # Corrected route to match /api/saved-packages
@cross_origin()
@login_required
def get_saved_packages(current_user):
    """Retrieves all saved packages for the authenticated user."""
    user_id = str(current_user.get('_id')) if current_user and current_user.get('_id') else None
    if not user_id:
         logger.error("Authenticated user has no _id during get saved packages.")
         return jsonify({'message': 'Authentication error: user ID not found'}), 500

    try:
        logger.info(f"Fetching saved packages for user {user_id}.")
        # Fetch using the repository
        saved_packages_list = saved_package_repository.find_by_user(user_id)

        # Convert list of SavedPackage models to list of dictionaries
        packages_dict_list = [pkg.model_dump() for pkg in saved_packages_list]

        logger.info(f"Found {len(packages_dict_list)} saved packages for user {user_id}.")
        return jsonify(packages_dict_list), 200

    except Exception as e:
        logger.error(f"Error fetching saved packages for user {user_id}: {e}", exc_info=True)
        return jsonify({'message': 'Error fetching saved packages', 'error': str(e)}), 500

@saved_packages_bp.route('/<package_id>', methods=['DELETE']) # This route remains the same
@cross_origin()
@login_required
def delete_saved_package(current_user, package_id):
    """Deletes a specific saved package for the authenticated user."""
    user_id = str(current_user.get('_id')) if current_user and current_user.get('_id') else None
    if not user_id:
         logger.error(f"Authenticated user has no _id during delete saved package {package_id}.")
         return jsonify({'message': 'Authentication error: user ID not found'}), 500

    try:
        logger.info(f"Attempting to delete saved package {package_id} for user {user_id}.")
        # Delete using the repository method that verifies user ownership
        success = saved_package_repository.delete_for_user(package_id, user_id)

        if success:
            logger.info(f"Package {package_id} deleted successfully for user {user_id}.")
            return jsonify({'message': 'Package deleted successfully'}), 200
        else:
            logger.warning(f"Failed to delete package {package_id} for user {user_id}: Package not found or not authorized.")
            return jsonify({'message': 'Package not found or not authorized'}), 404
    except Exception as e:
        logger.error(f"Error deleting saved package {package_id} for user {user_id}: {e}", exc_info=True)
        return jsonify({'message': 'Error deleting saved package', 'error': str(e)}), 500
