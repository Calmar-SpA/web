
-- RPC to safely increment or decrement user points
CREATE OR REPLACE FUNCTION increment_points(user_id_param UUID, points_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET points_balance = points_balance + points_param
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
